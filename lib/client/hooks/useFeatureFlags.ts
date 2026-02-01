"use client"

import { useCallback } from "react"

import type { FeatureFlagValue } from "@/lib/constants/feature-flags"

/**
 * Feature flags are currently client-evaluated (no `/api/v1/features/*`).
 * This is intentionally simple to reduce API surface area and drift.
 *
 * If you later add a strict feature-flags API, wire it through `lib/routes.ts`
 * and return the standard `{ data, error }` envelope.
 */
export function useFeatureFlags() {
  const flags: Record<string, boolean> = {}
  const isLoading = false

  const isEnabled = useCallback(
    (feature: FeatureFlagValue): boolean => flags[feature] === true,
    [flags]
  )

  const isAnyEnabled = useCallback(
    (features: FeatureFlagValue[]): boolean =>
      features.some((feature) => flags[feature] === true),
    [flags]
  )

  const areAllEnabled = useCallback(
    (features: FeatureFlagValue[]): boolean =>
      features.every((feature) => flags[feature] === true),
    [flags]
  )

  const enableFeature = useCallback(async (_feature: FeatureFlagValue): Promise<boolean> => {
    // No server persistence in strict mode.
    return false
  }, [])

  const disableFeature = useCallback(async (_feature: FeatureFlagValue): Promise<boolean> => {
    // No server persistence in strict mode.
    return false
  }, [])

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

export function useFeatureFlag(feature: FeatureFlagValue) {
  const { isEnabled, isLoading, enableFeature, disableFeature } = useFeatureFlags()

  return {
    isEnabled: isEnabled(feature),
    isLoading,
    enable: () => enableFeature(feature),
    disable: () => disableFeature(feature),
  }
}

