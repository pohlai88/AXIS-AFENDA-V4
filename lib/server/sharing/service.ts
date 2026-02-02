import "@/lib/server/only"
import { getDb } from "@/lib/server/db"
import { resourceShares, userProfiles, teams, organizations } from "@/lib/server/db/schema"
import { eq, and } from "drizzle-orm"
import { logger } from "@/lib/server/logger"
import { HttpError } from "@/lib/server/api/errors"

/**
 * Resource sharing service implementing Nextcloud-style cross-boundary sharing
 * Allows sharing resources (projects, tasks) with users, teams, or organizations
 */
export class SharingService {
  /**
   * Share a resource with a user
   */
  async shareWithUser(params: {
    resourceType: string
    resourceId: string
    ownerId: string
    targetUserId: string
    permissions: Record<string, boolean>
    expiresAt?: Date
  }) {
    try {
      const db = getDb()
      // Check if share already exists
      const [existingShare] = await db
        .select()
        .from(resourceShares)
        .where(
          and(
            eq(resourceShares.resourceType, params.resourceType),
            eq(resourceShares.resourceId, params.resourceId),
            eq(resourceShares.sharedWithUserId, params.targetUserId)
          )
        )
        .limit(1)

      if (existingShare) {
        // Update existing share
        const [updated] = await db
          .update(resourceShares)
          .set({
            permissions: params.permissions,
            expiresAt: params.expiresAt || null,
            updatedAt: new Date(),
          })
          .where(eq(resourceShares.id, existingShare.id))
          .returning()

        logger.info(
          { shareId: updated.id, resourceType: params.resourceType, resourceId: params.resourceId },
          "Updated user share"
        )

        return updated
      }

      // Create new share
      const [share] = await db
        .insert(resourceShares)
        .values({
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          ownerId: params.ownerId,
          sharedWithUserId: params.targetUserId,
          permissions: params.permissions,
          expiresAt: params.expiresAt || null,
        })
        .returning()

      logger.info(
        { shareId: share.id, resourceType: params.resourceType, resourceId: params.resourceId },
        "Created user share"
      )

      return share
    } catch (error) {
      logger.error({ error, params }, "Error sharing with user")
      throw new HttpError(500, "SHARE_ERROR", "Failed to share resource with user")
    }
  }

  /**
   * Share a resource with a team
   */
  async shareWithTeam(params: {
    resourceType: string
    resourceId: string
    ownerId: string
    targetTeamId: string
    permissions: Record<string, boolean>
    expiresAt?: Date
  }) {
    try {
      const db = getDb()
      // Verify team exists
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, params.targetTeamId))
        .limit(1)

      if (!team) {
        throw new HttpError(404, "TEAM_NOT_FOUND", "Team not found")
      }

      // Check if share already exists
      const [existingShare] = await db
        .select()
        .from(resourceShares)
        .where(
          and(
            eq(resourceShares.resourceType, params.resourceType),
            eq(resourceShares.resourceId, params.resourceId),
            eq(resourceShares.sharedWithTeamId, params.targetTeamId)
          )
        )
        .limit(1)

      if (existingShare) {
        // Update existing share
        const [updated] = await db
          .update(resourceShares)
          .set({
            permissions: params.permissions,
            expiresAt: params.expiresAt || null,
            updatedAt: new Date(),
          })
          .where(eq(resourceShares.id, existingShare.id))
          .returning()

        logger.info(
          { shareId: updated.id, resourceType: params.resourceType, resourceId: params.resourceId },
          "Updated team share"
        )

        return updated
      }

      // Create new share
      const [share] = await db
        .insert(resourceShares)
        .values({
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          ownerId: params.ownerId,
          sharedWithTeamId: params.targetTeamId,
          permissions: params.permissions,
          expiresAt: params.expiresAt || null,
        })
        .returning()

      logger.info(
        { shareId: share.id, resourceType: params.resourceType, resourceId: params.resourceId },
        "Created team share"
      )

      return share
    } catch (error) {
      if (error instanceof HttpError) throw error
      logger.error({ error, params }, "Error sharing with team")
      throw new HttpError(500, "SHARE_ERROR", "Failed to share resource with team")
    }
  }

  /**
   * Share a resource with an organization
   */
  async shareWithOrganization(params: {
    resourceType: string
    resourceId: string
    ownerId: string
    targetOrganizationId: string
    permissions: Record<string, boolean>
    expiresAt?: Date
  }) {
    try {
      const db = getDb()
      // Verify organization exists
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, params.targetOrganizationId))
        .limit(1)

      if (!org) {
        throw new HttpError(404, "ORGANIZATION_NOT_FOUND", "Organization not found")
      }

      // Check if share already exists
      const [existingShare] = await db
        .select()
        .from(resourceShares)
        .where(
          and(
            eq(resourceShares.resourceType, params.resourceType),
            eq(resourceShares.resourceId, params.resourceId),
            eq(resourceShares.sharedWithOrganizationId, params.targetOrganizationId)
          )
        )
        .limit(1)

      if (existingShare) {
        // Update existing share
        const [updated] = await db
          .update(resourceShares)
          .set({
            permissions: params.permissions,
            expiresAt: params.expiresAt || null,
            updatedAt: new Date(),
          })
          .where(eq(resourceShares.id, existingShare.id))
          .returning()

        logger.info(
          { shareId: updated.id, resourceType: params.resourceType, resourceId: params.resourceId },
          "Updated organization share"
        )

        return updated
      }

      // Create new share
      const [share] = await db
        .insert(resourceShares)
        .values({
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          ownerId: params.ownerId,
          sharedWithOrganizationId: params.targetOrganizationId,
          permissions: params.permissions,
          expiresAt: params.expiresAt || null,
        })
        .returning()

      logger.info(
        { shareId: share.id, resourceType: params.resourceType, resourceId: params.resourceId },
        "Created organization share"
      )

      return share
    } catch (error) {
      if (error instanceof HttpError) throw error
      logger.error({ error, params }, "Error sharing with organization")
      throw new HttpError(500, "SHARE_ERROR", "Failed to share resource with organization")
    }
  }

  /**
   * Remove a share
   */
  async removeShare(shareId: string, userId: string) {
    try {
      const db = getDb()
      // Verify user owns the share
      const [share] = await db
        .select()
        .from(resourceShares)
        .where(eq(resourceShares.id, shareId))
        .limit(1)

      if (!share) {
        throw new HttpError(404, "SHARE_NOT_FOUND", "Share not found")
      }

      if (share.ownerId !== userId) {
        throw new HttpError(403, "FORBIDDEN", "Only the owner can remove shares")
      }

      await db.delete(resourceShares).where(eq(resourceShares.id, shareId))

      logger.info({ shareId, userId }, "Removed share")

      return { success: true }
    } catch (error) {
      if (error instanceof HttpError) throw error
      logger.error({ error, shareId, userId }, "Error removing share")
      throw new HttpError(500, "SHARE_ERROR", "Failed to remove share")
    }
  }

  /**
   * List all shares for a resource
   */
  async listResourceShares(resourceType: string, resourceId: string, ownerId: string) {
    try {
      const db = getDb()
      const shares = await db
        .select()
        .from(resourceShares)
        .where(
          and(
            eq(resourceShares.resourceType, resourceType),
            eq(resourceShares.resourceId, resourceId),
            eq(resourceShares.ownerId, ownerId)
          )
        )

      // Enrich shares with target information
      const enrichedShares = await Promise.all(
        shares.map(async (share) => {
          let target = null

          if (share.sharedWithUserId) {
            const [user] = await db
              .select({ id: userProfiles.userId, displayName: userProfiles.displayName, email: userProfiles.email })
              .from(userProfiles)
              .where(eq(userProfiles.userId, share.sharedWithUserId))
              .limit(1)
            target = { type: "user", ...user }
          } else if (share.sharedWithTeamId) {
            const [team] = await db
              .select({ id: teams.id, name: teams.name })
              .from(teams)
              .where(eq(teams.id, share.sharedWithTeamId))
              .limit(1)
            target = { type: "team", ...team }
          } else if (share.sharedWithOrganizationId) {
            const [org] = await db
              .select({ id: organizations.id, name: organizations.name })
              .from(organizations)
              .where(eq(organizations.id, share.sharedWithOrganizationId))
              .limit(1)
            target = { type: "organization", ...org }
          }

          return {
            ...share,
            target,
          }
        })
      )

      return enrichedShares
    } catch (error) {
      logger.error({ error, resourceType, resourceId }, "Error listing resource shares")
      throw new HttpError(500, "SHARE_ERROR", "Failed to list resource shares")
    }
  }

  /**
   * Check if a user has access to a resource through shares
   */
  async hasShareAccess(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      const db = getDb()
      // Check direct user share
      const [directShare] = await db
        .select()
        .from(resourceShares)
        .where(
          and(
            eq(resourceShares.resourceType, resourceType),
            eq(resourceShares.resourceId, resourceId),
            eq(resourceShares.sharedWithUserId, userId)
          )
        )
        .limit(1)

      if (directShare) return true

      // TODO: Check team and organization shares
      // This requires querying memberships table to see if user belongs to
      // any teams or organizations that have access to this resource

      return false
    } catch (error) {
      logger.error({ error, userId, resourceType, resourceId }, "Error checking share access")
      return false
    }
  }

  /**
   * Get share permissions for a user on a resource
   */
  async getSharePermissions(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<Record<string, boolean>> {
    try {
      const db = getDb()
      const permissions: Record<string, boolean> = {}

      // Get direct user share
      const [directShare] = await db
        .select()
        .from(resourceShares)
        .where(
          and(
            eq(resourceShares.resourceType, resourceType),
            eq(resourceShares.resourceId, resourceId),
            eq(resourceShares.sharedWithUserId, userId)
          )
        )
        .limit(1)

      if (directShare && directShare.permissions) {
        Object.assign(permissions, directShare.permissions as Record<string, boolean>)
      }

      // TODO: Merge team and organization share permissions

      return permissions
    } catch (error) {
      logger.error({ error, userId, resourceType, resourceId }, "Error getting share permissions")
      return {}
    }
  }
}

// Singleton instance
export const sharingService = new SharingService()
