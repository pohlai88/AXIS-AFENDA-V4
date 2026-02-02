import "@/lib/server/only"
import { db } from "@/lib/server/db"
import { unstable_cache } from "next/cache"
import { organizations, teams, memberships, users } from "@/lib/server/db/schema"
import { eq, and, desc, ilike, count } from "drizzle-orm"
import { logger } from "@/lib/server/logger"
import { HttpError } from "@/lib/server/api/errors"
import { ORGANIZATION } from "@/lib/constants"
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationQuery
} from "@/lib/contracts/organizations"

export class OrganizationService {
  /**
   * Create a new organization
   */
  async create(data: CreateOrganizationInput, createdBy: string) {
    logger.info({ data: { name: data.name, slug: data.slug } }, "Creating organization")

    // Check if slug is already taken
    const [existing] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, data.slug))
      .limit(1)

    if (existing) {
      throw new HttpError(409, "CONFLICT", "Organization slug already exists")
    }

    // Create organization
    const [org] = await db.insert(organizations).values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      logo: data.logo,
      settings: {},
    }).returning()

    // Add creator as owner
    await db.insert(memberships).values({
      userId: createdBy,
      organizationId: org.id,
      role: ORGANIZATION.ROLES.OWNER,
      permissions: {},
      invitedBy: createdBy,
    })

    logger.info({ orgId: org.id }, "Organization created successfully")

    return org
  }

  /**
   * Get organization by ID
   */
  async getById(id: string) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1)

    if (!org) {
      throw new HttpError(404, "NOT_FOUND", "Organization not found")
    }

    return org
  }

  /**
   * Get organization by slug
   */
  async getBySlug(slug: string) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1)

    if (!org) {
      throw new HttpError(404, "NOT_FOUND", "Organization not found")
    }

    return org
  }

  /**
   * List organizations for a user
   */
  async listForUser(userId: string, query: OrganizationQuery) {
    const cacheKey = [
      "organizations:listForUser",
      userId,
      String(query.page),
      String(query.limit),
      query.search ?? "",
    ]

    const getCachedList = unstable_cache(
      async () => {
        const offset = (query.page - 1) * query.limit

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let whereClause: any = eq(memberships.userId, userId)

        if (query.search) {
          whereClause = and(
            whereClause,
            ilike(organizations.name, `%${query.search}%`)
          )
        }

        const orgList = await db
          .select({
            id: organizations.id,
            name: organizations.name,
            slug: organizations.slug,
            description: organizations.description,
            logo: organizations.logo,
            isActive: organizations.isActive,
            createdAt: organizations.createdAt,
            updatedAt: organizations.updatedAt,
            memberCount: count(memberships.id),
            teamCount: count(teams.id),
          })
          .from(organizations)
          .innerJoin(memberships, eq(organizations.id, memberships.organizationId))
          .leftJoin(teams, eq(organizations.id, teams.organizationId))
          .where(whereClause)
          .groupBy(organizations.id)
          .orderBy(desc(organizations.createdAt))
          .limit(query.limit)
          .offset(offset)

        // Get total count
        const totalCountResult = await db
          .select({ count: count() })
          .from(organizations)
          .innerJoin(memberships, eq(organizations.id, memberships.organizationId))
          .where(and(
            eq(memberships.userId, userId),
            query.search ? ilike(organizations.name, `%${query.search}%`) : undefined
          ))

        return {
          organizations: orgList,
          pagination: {
            page: query.page,
            limit: query.limit,
            total: totalCountResult[0].count,
            totalPages: Math.ceil(totalCountResult[0].count / query.limit),
          }
        }
      },
      cacheKey,
      { tags: [`organizations:${userId}`], revalidate: 3600 }
    )

    return getCachedList()
  }

  /**
   * Update organization
   */
  async update(id: string, data: UpdateOrganizationInput) {
    logger.info({ orgId: id, data }, "Updating organization")

    const [org] = await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning()

    if (!org) {
      throw new HttpError(404, "NOT_FOUND", "Organization not found")
    }

    logger.info({ orgId: id }, "Organization updated successfully")

    return org
  }

  /**
   * Delete organization (soft delete by setting isActive = false)
   */
  async delete(id: string) {
    logger.info({ orgId: id }, "Deactivating organization")

    const [org] = await db
      .update(organizations)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning()

    if (!org) {
      throw new HttpError(404, "NOT_FOUND", "Organization not found")
    }

    logger.info({ orgId: id }, "Organization deactivated successfully")

    return org
  }

  /**
   * Check if user is member of organization
   */
  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.organizationId, organizationId),
          eq(memberships.isActive, true)
        )
      )
      .limit(1)

    return !!membership
  }

  /**
   * Get user role in organization
   */
  async getUserRole(userId: string, organizationId: string): Promise<string | null> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.organizationId, organizationId),
          eq(memberships.isActive, true)
        )
      )
      .limit(1)

    return membership?.role || null
  }

  /**
   * Get organization members
   */
  async getMembers(organizationId: string, query: OrganizationQuery) {
    const offset = (query.page - 1) * query.limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = and(
      eq(memberships.organizationId, organizationId),
      eq(memberships.isActive, true)
    )

    if (query.search) {
      whereClause = and(
        whereClause,
        ilike(users.displayName, `%${query.search}%`)
      )
    }

    if (query.role) {
      whereClause = and(whereClause, eq(memberships.role, query.role))
    }

    const memberList = await db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        role: memberships.role,
        permissions: memberships.permissions,
        joinedAt: memberships.joinedAt,
        invitedBy: memberships.invitedBy,
        user: {
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatar: users.avatar,
        }
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(whereClause)
      .orderBy(desc(memberships.joinedAt))
      .limit(query.limit)
      .offset(offset)

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .where(whereClause)

    return {
      members: memberList,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCountResult[0].count,
        totalPages: Math.ceil(totalCountResult[0].count / query.limit),
      }
    }
  }
}

// Singleton instance
export const organizationService = new OrganizationService()
