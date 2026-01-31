"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/client/hooks/useAuth"
import type { FeatureFlagValue } from "@/lib/constants/feature-flags"

/**
 * Hook for checking feature flags on the client side
 * Supports progressive feature disclosure following the hybrid methodology
 */
export function useFeatureFlags() {
  const { user } = useAuth()
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all feature flags for the user
  useEffect(() => {
    async function fetchFlags() {
      if (!user?.id) {
        setFlags({})
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/v1/features/flags")
        if (response.ok) {
          const data = await response.json()
          setFlags(data.flags || {})
        }
      } catch (error) {
        console.error("Error fetching feature flags:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFlags()
  }, [user?.id])

  /**
   * Check if a single feature is enabled
   */
  const isEnabled = useCallback(
    (feature: FeatureFlagValue): boolean => {
      return flags[feature] === true
    },
    [flags]
  )

  /**
   * Check if any of the provided features are enabled
   */
  const isAnyEnabled = useCallback(
    (features: FeatureFlagValue[]): boolean => {
      return features.some((feature) => flags[feature] === true)
    },
    [flags]
  )

  /**
   * Check if all of the provided features are enabled
   */
  const areAllEnabled = useCallback(
    (features: FeatureFlagValue[]): boolean => {
      return features.every((feature) => flags[feature] === true)
    },
    [flags]
  )

  /**
   * Enable a feature for the current user
   */
  const enableFeature = useCallback(
    async (feature: FeatureFlagValue): Promise<boolean> => {
      if (!user?.id) return false

      try {
        const response = await fetch("/api/v1/features/enable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feature }),
        })

        if (response.ok) {
          setFlags((prev) => ({ ...prev, [feature]: true }))
          return true
        }
        return false
      } catch (error) {
        console.error("Error enabling feature:", error)
        return false
      }
    },
    [user?.id]
  )

  /**
   * Disable a feature for the current user
   */
  const disableFeature = useCallback(
    async (feature: FeatureFlagValue): Promise<boolean> => {
      if (!user?.id) return false

      try {
        const response = await fetch("/api/v1/features/disable", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feature }),
        })

        if (response.ok) {
          setFlags((prev) => ({ ...prev, [feature]: false }))
          return true
        }
        return false
      } catch (error) {
        console.error("Error disabling feature:", error)
        return false
      }
    },
    [user?.id]
  )

  return {
    flags,
    isLoading,
    isEnabled,
    isAnyEnabled,
    areAllEnabled,
    enableFeature,
    disableFeature,
  }
}

/**
 * Hook for checking a specific feature flag
 * More convenient for single feature checks
 */
export function useFeatureFlag(feature: FeatureFlagValue) {
  const { isEnabled, isLoading, enableFeature, disableFeature } = useFeatureFlags()

  return {
    isEnabled: isEnabled(feature),
    isLoading,
    enable: () => enableFeature(feature),
    disable: () => disableFeature(feature),
  }
}
