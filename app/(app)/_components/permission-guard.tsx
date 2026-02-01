"use client"

import { useEffect, useState, type ReactNode } from "react"

import { usePermissions } from "@/lib/client/hooks/usePermissions"
import type { PermissionValue } from "@/lib/constants"

interface PermissionGuardProps {
  permission?: PermissionValue
  permissions?: PermissionValue[]
  requireAny?: boolean
  children: ReactNode
  fallback?: ReactNode
  loading?: ReactNode
  context?: {
    organizationId?: string
    teamId?: string
    resourceId?: string
    resourceType?: string
  }
}

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
          result = await permissionHooks.hasPermission(permission)
        } else if (permissions && permissions.length > 0) {
          result = requireAny
            ? await permissionHooks.hasAnyPermission(permissions)
            : await permissionHooks.hasAllPermissions(permissions)
        } else {
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

  if (isChecking) return <>{loading}</>
  return <>{hasAccess ? children : fallback}</>
}

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

