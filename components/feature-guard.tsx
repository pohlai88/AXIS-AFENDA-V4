"use client"

import { type ReactNode } from "react"
import { useFeatureFlags, useFeatureFlag } from "@/lib/client/hooks/useFeatureFlags"
import type { FeatureFlagValue } from "@/lib/constants/feature-flags"

interface FeatureGuardProps {
  /** Single feature to check */
  feature?: FeatureFlagValue
  /** Multiple features to check (requires all by default) */
  features?: FeatureFlagValue[]
  /** If true, user needs ANY of the features. If false, needs ALL */
  requireAny?: boolean
  /** Content to render if feature is enabled */
  children: ReactNode
  /** Optional fallback content if feature is disabled */
  fallback?: ReactNode
  /** Optional loading content while checking features */
  loading?: ReactNode
}

/**
 * FeatureGuard component for progressive feature disclosure
 * Following the hybrid methodology's gradual rollout strategy
 * 
 * @example
 * ```tsx
 * <FeatureGuard feature={FEATURE_FLAGS.TEAMS_ENABLED}>
 *   <TeamSidebar />
 * </FeatureGuard>
 * ```
 * 
 * @example
 * ```tsx
 * <FeatureGuard 
 *   features={[FEATURE_FLAGS.ORG_HEADER, FEATURE_FLAGS.ORG_SWITCHER]}
 *   requireAny
 *   fallback={<SimpleHeader />}
 * >
 *   <OrganizationHeader />
 * </FeatureGuard>
 * ```
 */
export function FeatureGuard({
  feature,
  features,
  requireAny = false,
  children,
  fallback = null,
  loading = null,
}: FeatureGuardProps) {
  const { isEnabled, isAnyEnabled, areAllEnabled, isLoading } = useFeatureFlags()

  if (isLoading) {
    return <>{loading}</>
  }

  let shouldRender = false

  if (feature) {
    // Single feature check
    shouldRender = isEnabled(feature)
  } else if (features && features.length > 0) {
    // Multiple features check
    if (requireAny) {
      shouldRender = isAnyEnabled(features)
    } else {
      shouldRender = areAllEnabled(features)
    }
  }

  return <>{shouldRender ? children : fallback}</>
}

/**
 * Inverse feature guard - shows content when feature is DISABLED
 * Useful for showing upgrade prompts or alternative UI
 */
export function FeatureGuardInverse({
  feature,
  features,
  requireAny = false,
  children,
  fallback = null,
  loading = null,
}: FeatureGuardProps) {
  return (
    <FeatureGuard
      feature={feature}
      features={features}
      requireAny={requireAny}
      fallback={children}
      loading={loading}
    >
      {fallback}
    </FeatureGuard>
  )
}

/**
 * Simple feature flag wrapper for a single feature
 * More convenient than FeatureGuard for simple cases
 */
export function WithFeature({
  feature,
  children,
  fallback = null,
}: {
  feature: FeatureFlagValue
  children: ReactNode
  fallback?: ReactNode
}) {
  const { isEnabled, isLoading } = useFeatureFlag(feature)

  if (isLoading) return null

  return <>{isEnabled ? children : fallback}</>
}

/**
 * Show content only when feature is disabled
 * Useful for upgrade prompts
 */
export function WithoutFeature({
  feature,
  children,
  fallback = null,
}: {
  feature: FeatureFlagValue
  children: ReactNode
  fallback?: ReactNode
}) {
  const { isEnabled, isLoading } = useFeatureFlag(feature)

  if (isLoading) return null

  return <>{!isEnabled ? children : fallback}</>
}

/**
 * Progressive disclosure wrapper
 * Shows different content based on which phase is enabled
 */
export function ProgressiveFeature({
  personalContent,
  teamContent,
  organizationContent,
  enterpriseContent,
}: {
  personalContent: ReactNode
  teamContent?: ReactNode
  organizationContent?: ReactNode
  enterpriseContent?: ReactNode
}) {
  const { isEnabled } = useFeatureFlags()

  // Check from most advanced to least
  if (enterpriseContent && isEnabled("multi_org_support")) {
    return <>{enterpriseContent}</>
  }

  if (organizationContent && isEnabled("organizations_enabled")) {
    return <>{organizationContent}</>
  }

  if (teamContent && isEnabled("teams_enabled")) {
    return <>{teamContent}</>
  }

  // Always show personal content as fallback
  return <>{personalContent}</>
}
