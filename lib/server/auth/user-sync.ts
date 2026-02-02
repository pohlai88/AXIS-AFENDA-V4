import "@/lib/server/only"

import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

import { memberships, userProfiles } from "@/lib/server/db/schema"
import { logger } from "@/lib/server/logger"
import { OrganizationService } from "@/lib/server/organizations/service"
import { TeamService } from "@/lib/server/teams/service"
import { ORGANIZATION } from "@/lib/constants"
import { withRlsDb } from "@/lib/server/db/rls"
import type { Db } from "@/lib/server/db/client"

/**
 * IMPORTANT: User data is now managed entirely by Neon Auth (neon_auth.user)
 * This sync function only ensures organizational setup and membership.
 * DO NOT create/update users in custom tables - this breaks Neon Auth best practices.
 */

/**
 * IMPORTANT: User data is now managed entirely by Neon Auth (neon_auth.user)
 * This sync function should NOT create/update users in custom tables.
 * Only ensure organizational memberships and defaults.
 * @deprecated User creation is handled by Neon Auth only
 */

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

  /**
   * NEON AUTH BEST PRACTICE:
   * User data is managed by Neon Auth (neon_auth.user table).
   * This function maintains APP-OWNED profile/preferences ONLY (user_profiles)
   * and ensures organization defaults/memberships.
   */
  const userId = identity.id
  const email = identity.email

  return await withRlsDb(userId, async (db) => {
    // Upsert app-owned profile snapshot (for UI + local joins). Not an auth source-of-truth.
    try {
      await db
        .insert(userProfiles)
        .values({
          userId,
          email,
          displayName: identity.name,
          avatar: identity.avatar,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userProfiles.userId,
          set: {
            email,
            displayName: identity.name,
            avatar: identity.avatar,
            updatedAt: new Date(),
          },
        })
    } catch (e) {
      logger.warn({ err: e, userId }, "Failed to upsert user profile snapshot")
    }

    // Ensure default organization for new users
    const hasMembership = await hasAnyMembership(userId, db)
    if (!hasMembership) {
      await ensureDefaultOrganization(
        {
          ...identity,
          id: userId,
          email: email,
          name: identity.name,
          avatar: identity.avatar,
        },
        db
      )
    }

    return {
      userId: userId,
      email: email,
      role: "user",
      created: false,
    }
  })
}

async function hasAnyMembership(userId: string, db: Db) {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.isActive, true)))
    .limit(1)

  return Boolean(membership)
}

async function ensureDefaultOrganization(identity: NeonAuthIdentity, db: Db) {
  const orgName = identity.name ? `${identity.name}'s Workspace` : "Personal Workspace"
  const baseSlug = slugify(identity.name ?? identity.email?.split("@")[0] ?? "workspace")

  const org = await createOrganizationWithUniqueSlug(orgName, baseSlug, identity.id, db)

  await teamService.create(
    {
      organizationId: org.id,
      name: "Main",
      slug: "main",
      description: "Default team",
    },
    identity.id,
    db
  )
}

async function createOrganizationWithUniqueSlug(name: string, baseSlug: string, userId: string, db: Db) {
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
        userId,
        db
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
    userId,
    db
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
