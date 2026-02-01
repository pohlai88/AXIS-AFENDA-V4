import "@/lib/server/only"

import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

import { db } from "@/lib/server/db"
import { users, memberships } from "@/lib/server/db/schema"
import { logger } from "@/lib/server/logger"
import { OrganizationService } from "@/lib/server/organizations/service"
import { TeamService } from "@/lib/server/teams/service"
import { ORGANIZATION } from "@/lib/constants"

export interface NeonAuthIdentity {
  id: string
  email?: string
  name?: string
  avatar?: string
  provider?: string
  emailVerified?: boolean
}

export interface UserSyncResult {
  userId: string
  email?: string
  role?: string
  created: boolean
}

const organizationService = new OrganizationService()
const teamService = new TeamService()

export async function syncUserFromAuth(identity: NeonAuthIdentity): Promise<UserSyncResult | null> {
  if (!identity.id || !identity.email) {
    logger.warn({ identity: { id: identity.id, email: identity.email } }, "Missing required auth identity fields")
    return null
  }

  const now = new Date()
  const [byId] = await db.select().from(users).where(eq(users.id, identity.id)).limit(1)
  const [byEmail] = byId ? [null] : await db.select().from(users).where(eq(users.email, identity.email)).limit(1)

  const existing = byId ?? byEmail

  if (!existing) {
    await db.insert(users).values({
      id: identity.id,
      email: identity.email,
      displayName: identity.name,
      avatar: identity.avatar,
      role: "user",
      emailVerified: identity.emailVerified ? now : undefined,
      provider: identity.provider ?? "neon-auth",
      isActive: true,
      lastLoginAt: now,
      loginCount: 1,
      createdAt: now,
      updatedAt: now,
    })

    await ensureDefaultOrganization(identity)

    return {
      userId: identity.id,
      email: identity.email,
      role: "user",
      created: true,
    }
  }

  await db
    .update(users)
    .set({
      email: existing.email || identity.email,
      displayName: identity.name ?? existing.displayName,
      avatar: identity.avatar ?? existing.avatar,
      provider: existing.provider || identity.provider || "neon-auth",
      emailVerified: existing.emailVerified ?? (identity.emailVerified ? now : undefined),
      isActive: true,
      lastLoginAt: now,
      loginCount: (existing.loginCount ?? 0) + 1,
      updatedAt: now,
    })
    .where(eq(users.id, existing.id))

  const hasMembership = await hasAnyMembership(existing.id)
  if (!hasMembership) {
    await ensureDefaultOrganization({
      ...identity,
      id: existing.id,
      email: identity.email ?? existing.email,
      name: identity.name ?? existing.displayName ?? undefined,
      avatar: identity.avatar ?? existing.avatar ?? undefined,
    })
  }

  return {
    userId: existing.id,
    email: existing.email,
    role: existing.role,
    created: false,
  }
}

async function hasAnyMembership(userId: string) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.isActive, true)))
    .limit(1)

  return Boolean(membership)
}

async function ensureDefaultOrganization(identity: NeonAuthIdentity) {
  const orgName = identity.name ? `${identity.name}'s Workspace` : "Personal Workspace"
  const baseSlug = slugify(identity.name ?? identity.email?.split("@")[0] ?? "workspace")

  const org = await createOrganizationWithUniqueSlug(orgName, baseSlug, identity.id)

  await teamService.create(
    {
      organizationId: org.id,
      name: "Main",
      slug: "main",
      description: "Default team",
    },
    identity.id
  )
}

async function createOrganizationWithUniqueSlug(name: string, baseSlug: string, userId: string) {
  const maxAttempts = 3
  let slug = baseSlug

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await organizationService.create(
        {
          name,
          slug,
          description: "Default workspace",
        },
        userId
      )
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error
      }
      slug = `${baseSlug}-${nanoid(6)}`.slice(0, ORGANIZATION.MAX_SLUG_LENGTH)
    }
  }

  return organizationService.create(
    {
      name,
      slug: `${baseSlug}-${nanoid(6)}`.slice(0, ORGANIZATION.MAX_SLUG_LENGTH),
      description: "Default workspace",
    },
    userId
  )
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, ORGANIZATION.MAX_SLUG_LENGTH)
}
