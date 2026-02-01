import "@/lib/server/only"
import { db } from "@/lib/server/db"
import { teams, organizations, memberships, users } from "@/lib/server/db/schema"
import { eq, and, desc, ilike, count } from "drizzle-orm"
import { logger } from "@/lib/server/logger"
import { HttpError } from "@/lib/server/api/errors"
import { TEAM } from "@/lib/constants"
import type {
  CreateTeamInput,
  UpdateTeamInput,
  TeamQuery
} from "@/lib/contracts/organizations"

export class TeamService {
  /**
   * Create a new team
   */
  async create(data: CreateTeamInput, createdBy: string) {
    logger.info({ data: { name: data.name, organizationId: data.organizationId } }, "Creating team")

    // Verify organization exists and user is member
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, data.organizationId))
      .limit(1)

    if (!org) {
      throw new HttpError(404, "NOT_FOUND", "Organization not found")
    }

    const [isMember] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, createdBy),
          eq(memberships.organizationId, data.organizationId),
          eq(memberships.isActive, true)
        )
      )
      .limit(1)

    if (!isMember) {
      throw new HttpError(403, "FORBIDDEN", "Organization membership required")
    }

    // Check if slug is already taken in the organization
    const [existing] = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.organizationId, data.organizationId),
          eq(teams.slug, data.slug)
        )
      )
      .limit(1)

    if (existing) {
      throw new HttpError(409, "CONFLICT", "Team slug already exists in this organization")
    }

    // Create team
    const [team] = await db.insert(teams).values({
      organizationId: data.organizationId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      parentId: data.parentId,
      settings: {},
    }).returning()

    // Add creator as team manager
    await db.insert(memberships).values({
      userId: createdBy,
      organizationId: data.organizationId,
      teamId: team.id,
      role: TEAM.ROLES.MANAGER,
      permissions: {},
      invitedBy: createdBy,
    })

    logger.info({ teamId: team.id }, "Team created successfully")

    return team
  }

  /**
   * Get team by ID
   */
  async getById(id: string) {
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, id))
      .limit(1)

    if (!team) {
      throw new HttpError(404, "NOT_FOUND", "Team not found")
    }

    return team
  }

  /**
   * List teams for an organization
   */
  async listForOrganization(
    organizationId: string,
    userId: string,
    query: TeamQuery
  ) {
    // Verify user is member of organization
    const [isMember] = await db
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

    if (!isMember) {
      throw new HttpError(403, "FORBIDDEN", "Organization membership required")
    }

    const offset = (query.page - 1) * query.limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = eq(teams.organizationId, organizationId)

    if (query.search) {
      whereClause = and(
        whereClause,
        ilike(teams.name, `%${query.search}%`)
      )
    }

    const teamList = await db
      .select({
        id: teams.id,
        organizationId: teams.organizationId,
        name: teams.name,
        slug: teams.slug,
        description: teams.description,
        parentId: teams.parentId,
        isActive: teams.isActive,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberCount: count(memberships.id),
        parentTeam: {
          id: teams.parentId,
        }
      })
      .from(teams)
      .leftJoin(memberships, eq(teams.id, memberships.teamId))
      .where(whereClause)
      .groupBy(teams.id)
      .orderBy(desc(teams.createdAt))
      .limit(query.limit)
      .offset(offset)

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(teams)
      .where(and(
        eq(teams.organizationId, organizationId),
        query.search ? ilike(teams.name, `%${query.search}%`) : undefined
      ))

    return {
      teams: teamList,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCountResult[0].count,
        totalPages: Math.ceil(totalCountResult[0].count / query.limit),
      }
    }
  }

  /**
   * List teams for a user
   */
  async listForUser(userId: string, query: TeamQuery) {
    const offset = (query.page - 1) * query.limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let whereClause: any = eq(memberships.userId, userId)

    if (query.search) {
      whereClause = and(
        whereClause,
        ilike(teams.name, `%${query.search}%`)
      )
    }

    const teamList = await db
      .select({
        id: teams.id,
        organizationId: teams.organizationId,
        name: teams.name,
        slug: teams.slug,
        description: teams.description,
        parentId: teams.parentId,
        isActive: teams.isActive,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberCount: count(memberships.id),
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        }
      })
      .from(teams)
      .innerJoin(memberships, eq(teams.id, memberships.teamId))
      .innerJoin(organizations, eq(teams.organizationId, organizations.id))
      .where(and(
        whereClause,
        eq(memberships.isActive, true),
        eq(teams.isActive, true)
      ))
      .groupBy(teams.id, organizations.id)
      .orderBy(desc(teams.createdAt))
      .limit(query.limit)
      .offset(offset)

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(teams)
      .innerJoin(memberships, eq(teams.id, memberships.teamId))
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.isActive, true),
        eq(teams.isActive, true),
        query.search ? ilike(teams.name, `%${query.search}%`) : undefined
      ))

    return {
      teams: teamList,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: totalCountResult[0].count,
        totalPages: Math.ceil(totalCountResult[0].count / query.limit),
      }
    }
  }

  /**
   * Update team
   */
  async update(id: string, data: UpdateTeamInput) {
    logger.info({ teamId: id, data }, "Updating team")

    const [team] = await db
      .update(teams)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id))
      .returning()

    if (!team) {
      throw new HttpError(404, "NOT_FOUND", "Team not found")
    }

    logger.info({ teamId: id }, "Team updated successfully")

    return team
  }

  /**
   * Delete team (soft delete by setting isActive = false)
   */
  async delete(id: string) {
    logger.info({ teamId: id }, "Deactivating team")

    const [team] = await db
      .update(teams)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, id))
      .returning()

    if (!team) {
      throw new HttpError(404, "NOT_FOUND", "Team not found")
    }

    logger.info({ teamId: id }, "Team deactivated successfully")

    return team
  }

  /**
   * Check if user is member of team
   */
  async isMember(userId: string, teamId: string): Promise<boolean> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.teamId, teamId),
          eq(memberships.isActive, true)
        )
      )
      .limit(1)

    return !!membership
  }

  /**
   * Get user role in team
   */
  async getUserRole(userId: string, teamId: string): Promise<string | null> {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(
        and(
          eq(memberships.userId, userId),
          eq(memberships.teamId, teamId),
          eq(memberships.isActive, true)
        )
      )
      .limit(1)

    return membership?.role || null
  }
}

// Singleton instance
export const teamService = new TeamService()
