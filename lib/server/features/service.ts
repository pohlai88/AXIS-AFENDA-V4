import "@/lib/server/only"
import { db } from "@/lib/server/db"
import { users } from "@/lib/server/db/schema"
import { eq } from "drizzle-orm"
import { logger } from "@/lib/server/logger"
import {
  DEFAULT_FEATURE_FLAGS,
  FEATURE_TRIGGERS,
  type FeatureFlagValue,
} from "@/lib/constants/feature-flags"

/**
 * Feature flags service for progressive rollout
 * Implements the hybrid methodology's gradual adoption strategy
 */
export class FeatureFlagService {
  /**
   * Check if a feature is enabled for a user
   */
  async isEnabled(userId: string, feature: FeatureFlagValue): Promise<boolean> {
    try {
      // Get user preferences
      const [user] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        return DEFAULT_FEATURE_FLAGS[feature] || false
      }

      const preferences = user.preferences as Record<string, unknown> | null
      const featureFlags = preferences?.featureFlags as Record<string, boolean> | undefined

      // Check user-specific override
      if (featureFlags && feature in featureFlags) {
        return featureFlags[feature]
      }

      // Check if feature should be auto-enabled by trigger
      const shouldAutoEnable = await this.checkTrigger(userId, feature)
      if (shouldAutoEnable) {
        // Auto-enable and save
        await this.enableFeature(userId, feature)
        return true
      }

      // Fall back to default
      return DEFAULT_FEATURE_FLAGS[feature] || false
    } catch (error) {
      logger.error({ error, userId, feature }, "Error checking feature flag")
      return DEFAULT_FEATURE_FLAGS[feature] || false
    }
  }

  /**
   * Check multiple features at once
   */
  async areEnabled(
    userId: string,
    features: FeatureFlagValue[]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    await Promise.all(
      features.map(async (feature) => {
        results[feature] = await this.isEnabled(userId, feature)
      })
    )

    return results
  }

  /**
   * Enable a feature for a user
   */
  async enableFeature(userId: string, feature: FeatureFlagValue): Promise<void> {
    try {
      const [user] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        logger.warn({ userId, feature }, "User not found for feature flag update")
        return
      }

      const preferences = (user.preferences as Record<string, unknown>) || {}
      const featureFlags = (preferences.featureFlags as Record<string, boolean>) || {}

      featureFlags[feature] = true

      await db
        .update(users)
        .set({
          preferences: {
            ...preferences,
            featureFlags,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      logger.info({ userId, feature }, "Feature flag enabled")
    } catch (error) {
      logger.error({ error, userId, feature }, "Error enabling feature flag")
    }
  }

  /**
   * Disable a feature for a user
   */
  async disableFeature(userId: string, feature: FeatureFlagValue): Promise<void> {
    try {
      const [user] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        logger.warn({ userId, feature }, "User not found for feature flag update")
        return
      }

      const preferences = (user.preferences as Record<string, unknown>) || {}
      const featureFlags = (preferences.featureFlags as Record<string, boolean>) || {}

      featureFlags[feature] = false

      await db
        .update(users)
        .set({
          preferences: {
            ...preferences,
            featureFlags,
          },
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      logger.info({ userId, feature }, "Feature flag disabled")
    } catch (error) {
      logger.error({ error, userId, feature }, "Error disabling feature flag")
    }
  }

  /**
   * Get all feature flags for a user
   */
  async getAllFlags(userId: string): Promise<Record<string, boolean>> {
    try {
      const [user] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        return DEFAULT_FEATURE_FLAGS
      }

      const preferences = user.preferences as Record<string, unknown> | null
      const featureFlags = (preferences?.featureFlags as Record<string, boolean>) || {}

      // Merge with defaults
      const allFlags = { ...DEFAULT_FEATURE_FLAGS }

      // Apply user overrides
      Object.keys(featureFlags).forEach((key) => {
        if (key in allFlags) {
          allFlags[key as FeatureFlagValue] = featureFlags[key]
        }
      })

      // Check triggers for auto-enable
      await Promise.all(
        Object.keys(FEATURE_TRIGGERS).map(async (feature) => {
          const featureFlag = feature as FeatureFlagValue
          if (!allFlags[featureFlag]) {
            const shouldEnable = await this.checkTrigger(userId, featureFlag)
            if (shouldEnable) {
              allFlags[featureFlag] = true
              // Auto-enable in background
              this.enableFeature(userId, featureFlag).catch((err) =>
                logger.error({ err, userId, feature: featureFlag }, "Error auto-enabling feature")
              )
            }
          }
        })
      )

      return allFlags
    } catch (error) {
      logger.error({ error, userId }, "Error getting all feature flags")
      return DEFAULT_FEATURE_FLAGS
    }
  }

  /**
   * Check if a feature trigger condition is met
   */
  private async checkTrigger(userId: string, feature: FeatureFlagValue): Promise<boolean> {
    const trigger = FEATURE_TRIGGERS[feature as keyof typeof FEATURE_TRIGGERS]
    if (!trigger) return false

    try {
      switch (trigger.type) {
        case "collaborator_count":
          // TODO: Query actual collaborator count from shares/memberships
          return false

        case "team_count":
          // TODO: Query actual team count from memberships
          return false

        case "share_count":
          // TODO: Query actual share count from resource_shares
          return false

        case "depends_on":
          // Check if dependent feature is enabled
          if ("flag" in trigger) {
            return await this.isEnabled(userId, trigger.flag as FeatureFlagValue)
          }
          return false

        default:
          return false
      }
    } catch (error) {
      logger.error({ error, userId, feature, trigger }, "Error checking feature trigger")
      return false
    }
  }

  /**
   * Enable a phase of features for a user
   */
  async enablePhase(userId: string, phase: string): Promise<void> {
    const { PHASE_FEATURES } = await import("@/lib/constants/feature-flags")
    const features = PHASE_FEATURES[phase]

    if (!features) {
      logger.warn({ userId, phase }, "Unknown feature phase")
      return
    }

    await Promise.all(features.map((feature) => this.enableFeature(userId, feature)))

    logger.info({ userId, phase, featureCount: features.length }, "Feature phase enabled")
  }

  /**
   * Reset all feature flags to defaults for a user
   */
  async resetToDefaults(userId: string): Promise<void> {
    try {
      const [user] = await db
        .select({ preferences: users.preferences })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        logger.warn({ userId }, "User not found for feature flag reset")
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const preferences = (user.preferences as Record<string, any>) || {}
      delete preferences.featureFlags

      await db
        .update(users)
        .set({
          preferences,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))

      logger.info({ userId }, "Feature flags reset to defaults")
    } catch (error) {
      logger.error({ error, userId }, "Error resetting feature flags")
    }
  }
}

// Singleton instance
export const featureFlagService = new FeatureFlagService()
