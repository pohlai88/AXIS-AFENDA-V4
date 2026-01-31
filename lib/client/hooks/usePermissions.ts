"use client"

import { useCallback, useMemo } from "react"
import { useAuth } from "@/lib/client/hooks/useAuth"
import type { PermissionValue } from "@/lib/constants"

/**
 * Permission context for client-side permission checks
 * Follows the hybrid methodology for progressive permission disclosure
 */
interface PermissionContext {
  organizationId?: string
  teamId?: string
  resourceId?: string
  resourceType?: string
}

/**
 * Hook for checking user permissions on the client side
 * Integrates with the server-side permission service
 */
export function usePermissions(context?: PermissionContext) {
  const { user } = useAuth()

  /**
   * Check if user has a specific permission
   * This makes an API call to the server for accurate permission checking
   */
  const hasPermission = useCallback(
    async (permission: PermissionValue): Promise<boolean> => {
      if (!user?.id) return false

      try {
        const response = await fetch("/api/v1/permissions/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permission,
            context: {
              ...context,
              userId: user.id,
            },
          }),
        })

        if (!response.ok) return false

        const data = await response.json()
        return data.hasPermission || false
      } catch (error) {
        console.error("Error checking permission:", error)
        return false
      }
    },
    [user, context]
  )

  /**
   * Check multiple permissions at once
   * More efficient than calling hasPermission multiple times
   */
  const hasPermissions = useCallback(
    async (permissions: PermissionValue[]): Promise<Record<string, boolean>> => {
      if (!user?.id) {
        return permissions.reduce((acc, perm) => ({ ...acc, [perm]: false }), {})
      }

      try {
        const response = await fetch("/api/v1/permissions/check-multiple", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissions,
            context: {
              ...context,
              userId: user.id,
            },
          }),
        })

        if (!response.ok) {
          return permissions.reduce((acc, perm) => ({ ...acc, [perm]: false }), {})
        }

        const data = await response.json()
        return data.permissions || {}
      } catch (error) {
        console.error("Error checking permissions:", error)
        return permissions.reduce((acc, perm) => ({ ...acc, [perm]: false }), {})
      }
    },
    [user, context]
  )

  /**
   * Check if user has ANY of the provided permissions
   */
  const hasAnyPermission = useCallback(
    async (permissions: PermissionValue[]): Promise<boolean> => {
      const results = await hasPermissions(permissions)
      return Object.values(results).some((has) => has === true)
    },
    [hasPermissions]
  )

  /**
   * Check if user has ALL of the provided permissions
   */
  const hasAllPermissions = useCallback(
    async (permissions: PermissionValue[]): Promise<boolean> => {
      const results = await hasPermissions(permissions)
      return Object.values(results).every((has) => has === true)
    },
    [hasPermissions]
  )

  /**
   * Get all permissions for the current context
   * Useful for debugging or displaying permission lists
   */
  const getAllPermissions = useCallback(async (): Promise<string[]> => {
    if (!user?.id) return []

    try {
      const response = await fetch("/api/v1/permissions/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: {
            ...context,
            userId: user.id,
          },
        }),
      })

      if (!response.ok) return []

      const data = await response.json()
      return data.permissions || []
    } catch (error) {
      console.error("Error getting all permissions:", error)
      return []
    }
  }, [user, context])

  return {
    hasPermission,
    hasPermissions,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissions,
    isAuthenticated: !!user?.id,
  }
}

/**
 * Hook for organization-specific permissions
 */
export function useOrganizationPermissions(organizationId?: string) {
  const context = useMemo(
    () => (organizationId ? { organizationId } : undefined),
    [organizationId]
  )

  return usePermissions(context)
}

/**
 * Hook for team-specific permissions
 */
export function useTeamPermissions(teamId?: string, organizationId?: string) {
  const context = useMemo(
    () =>
      teamId || organizationId
        ? {
          teamId,
          organizationId,
        }
        : undefined,
    [teamId, organizationId]
  )

  return usePermissions(context)
}

/**
 * Hook for resource-specific permissions
 */
export function useResourcePermissions(
  resourceType?: string,
  resourceId?: string,
  additionalContext?: Omit<PermissionContext, "resourceType" | "resourceId">
) {
  const context = useMemo(
    () =>
      resourceType && resourceId
        ? {
          resourceType,
          resourceId,
          ...additionalContext,
        }
        : undefined,
    [resourceType, resourceId, additionalContext]
  )

  return usePermissions(context)
}
