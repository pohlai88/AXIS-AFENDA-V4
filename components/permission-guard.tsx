"use client"

import { useState, useEffect, type ReactNode } from "react"
import { usePermissions } from "@/lib/client/hooks/usePermissions"
import type { PermissionValue } from "@/lib/constants"

interface PermissionGuardProps {
  /** Single permission to check */
  permission?: PermissionValue
  /** Multiple permissions to check (requires all by default) */
  permissions?: PermissionValue[]
  /** If true, user needs ANY of the permissions. If false, needs ALL */
  requireAny?: boolean
  /** Content to render if user has permission */
  children: ReactNode
  /** Optional fallback content if user doesn't have permission */
  fallback?: ReactNode
  /** Optional loading content while checking permissions */
  loading?: ReactNode
  /** Permission context */
  context?: {
    organizationId?: string
    teamId?: string
    resourceId?: string
    resourceType?: string
  }
}

/**
 * PermissionGuard component for declarative permission-based rendering
 * Following the hybrid methodology for simple, progressive permission checks
 * 
 * @example
 * ```tsx
 * <PermissionGuard permission={PERMISSIONS.TEAM_MANAGE}>
 *   <Button>Manage Team</Button>
 * </PermissionGuard>
 * ```
 * 
 * @example
 * ```tsx
 * <PermissionGuard 
 *   permissions={[PERMISSIONS.PROJECT_UPDATE, PERMISSIONS.PROJECT_DELETE]}
 *   requireAny
 *   fallback={<div>No access</div>}
 * >
 *   <ProjectActions />
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  permissions,
  requireAny = false,
  children,
  fallback = null,
  loading = null,
  context,
}: PermissionGuardProps) {
  const [hasAccess, setHasAccess] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const permissionHooks = usePermissions(context)

  useEffect(() => {
    async function checkPermissions() {
      setIsChecking(true)

      try {
        let result = false

        if (permission) {
          // Single permission check
          result = await permissionHooks.hasPermission(permission)
        } else if (permissions && permissions.length > 0) {
          // Multiple permissions check
          if (requireAny) {
            result = await permissionHooks.hasAnyPermission(permissions)
          } else {
            result = await permissionHooks.hasAllPermissions(permissions)
          }
        } else {
          // No permissions specified, default to authenticated check
          result = permissionHooks.isAuthenticated
        }

        setHasAccess(result)
      } catch (error) {
        console.error("Error checking permissions:", error)
        setHasAccess(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkPermissions()
  }, [permission, permissions, requireAny, permissionHooks, context])

  if (isChecking) {
    return <>{loading}</>
  }

  return <>{hasAccess ? children : fallback}</>
}

/**
 * Inverse permission guard - shows content when user DOESN'T have permission
 */
export function PermissionGuardInverse({
  permission,
  permissions,
  requireAny = false,
  children,
  fallback = null,
  loading = null,
  context,
}: PermissionGuardProps) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAny={requireAny}
      fallback={children}
      loading={loading}
      context={context}
    >
      {fallback}
    </PermissionGuard>
  )
}

/**
 * Organization-specific permission guard
 */
export function OrganizationPermissionGuard({
  organizationId,
  permission,
  permissions,
  requireAny,
  children,
  fallback,
  loading,
}: Omit<PermissionGuardProps, "context"> & { organizationId: string }) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAny={requireAny}
      context={{ organizationId }}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * Team-specific permission guard
 */
export function TeamPermissionGuard({
  teamId,
  organizationId,
  permission,
  permissions,
  requireAny,
  children,
  fallback,
  loading,
}: Omit<PermissionGuardProps, "context"> & {
  teamId: string
  organizationId?: string
}) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAny={requireAny}
      context={{ teamId, organizationId }}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </PermissionGuard>
  )
}

/**
 * Resource-specific permission guard
 */
export function ResourcePermissionGuard({
  resourceType,
  resourceId,
  organizationId,
  teamId,
  permission,
  permissions,
  requireAny,
  children,
  fallback,
  loading,
}: Omit<PermissionGuardProps, "context"> & {
  resourceType: string
  resourceId: string
  organizationId?: string
  teamId?: string
}) {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAny={requireAny}
      context={{ resourceType, resourceId, organizationId, teamId }}
      fallback={fallback}
      loading={loading}
    >
      {children}
    </PermissionGuard>
  )
}
