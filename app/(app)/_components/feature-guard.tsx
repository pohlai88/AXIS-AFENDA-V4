"use client"

import { type ReactNode } from "react"

import { useFeatureFlag, useFeatureFlags } from "@/lib/client/hooks/useFeatureFlags"
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
    shouldRender = isEnabled(feature)
  } else if (features && features.length > 0) {
    shouldRender = requireAny ? isAnyEnabled(features) : areAllEnabled(features)
  }

  return <>{shouldRender ? children : fallback}</>
}

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

  if (enterpriseContent && isEnabled("multi_org_support")) return <>{enterpriseContent}</>
  if (organizationContent && isEnabled("organizations_enabled")) return <>{organizationContent}</>
  if (teamContent && isEnabled("teams_enabled")) return <>{teamContent}</>
  return <>{personalContent}</>
}

