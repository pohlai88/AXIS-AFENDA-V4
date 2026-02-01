"use client"

import { useCallback, useMemo } from "react"

import type { PermissionValue } from "@/lib/constants"
import { useAuth } from "@/lib/client/hooks/useAuth"

/**
 * Permissions are currently client-evaluated (no `/api/v1/permissions/*`).
 * This keeps API surface minimal and avoids drift.
 *
 * If you later need server-authoritative checks, add a strict API surface
 * and wire endpoints through `lib/routes.ts` + envelope helpers.
 */
interface PermissionContext {
  organizationId?: string
  teamId?: string
  resourceId?: string
  resourceType?: string
}

export function usePermissions(_context?: PermissionContext) {
  const { user } = useAuth()

  const hasPermission = useCallback(async (_permission: PermissionValue): Promise<boolean> => {
    // Strict mode default: allow nothing unless you implement a server source.
    return false
  }, [])

  const hasPermissions = useCallback(async (permissions: PermissionValue[]): Promise<Record<string, boolean>> => {
    // Strict mode default: deny all.
    void user
    return permissions.reduce((acc, perm) => ({ ...acc, [perm]: false }), {} as Record<string, boolean>)
  }, [user])

  const hasAnyPermission = useCallback(async (permissions: PermissionValue[]): Promise<boolean> => {
    const results = await hasPermissions(permissions)
    return Object.values(results).some((has) => has === true)
  }, [hasPermissions])

  const hasAllPermissions = useCallback(async (permissions: PermissionValue[]): Promise<boolean> => {
    const results = await hasPermissions(permissions)
    return Object.values(results).every((has) => has === true)
  }, [hasPermissions])

  const getAllPermissions = useCallback(async (): Promise<string[]> => {
    return []
  }, [])

  return {
    hasPermission,
    hasPermissions,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissions,
    isAuthenticated: !!user?.id,
  }
}

export function useOrganizationPermissions(organizationId?: string) {
  const context = useMemo(() => (organizationId ? { organizationId } : undefined), [organizationId])
  return usePermissions(context)
}

export function useTeamPermissions(teamId?: string, organizationId?: string) {
  const context = useMemo(
    () => (teamId || organizationId ? { teamId, organizationId } : undefined),
    [teamId, organizationId]
  )
  return usePermissions(context)
}

export function useResourcePermissions(
  resourceType?: string,
  resourceId?: string,
  additionalContext?: Omit<PermissionContext, "resourceType" | "resourceId">
) {
  const context = useMemo(
    () =>
      resourceType && resourceId
        ? { resourceType, resourceId, ...additionalContext }
        : undefined,
    [resourceType, resourceId, additionalContext]
  )
  return usePermissions(context)
}

