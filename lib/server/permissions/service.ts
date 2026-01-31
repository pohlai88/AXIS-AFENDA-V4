import "@/lib/server/only"
import { PERMISSIONS, ORGANIZATION, TEAM } from "@/lib/constants"
import type { PermissionValue } from "@/lib/constants"

/**
 * Permission service for calculating and checking user permissions
 * following the hybrid methodology (Focalboard + Mattermost + Nextcloud)
 */
export class PermissionService {
  /**
   * Calculate all permissions for a user in a given context
   */
  async calculatePermissions(context: {
    userId: string
    organizationId?: string
    teamId?: string
    resourceId?: string
    resourceType?: string
  }): Promise<Set<string>> {
    const permissions = new Set<string>()
    
    // 1. Base permissions - everyone gets basic permissions
    permissions.add(PERMISSIONS.TASK_CREATE)
    permissions.add(PERMISSIONS.PROJECT_CREATE)
    permissions.add(PERMISSIONS.TASK_READ)
    permissions.add(PERMISSIONS.PROJECT_READ)
    
    // 2. Add organization-specific permissions if in org context
    if (context.organizationId) {
      const orgPermissions = await this.getOrganizationPermissions(
        context.userId,
        context.organizationId
      )
      orgPermissions.forEach(p => permissions.add(p))
    }
    
    // 3. Add team-specific permissions if in team context
    if (context.teamId) {
      const teamPermissions = await this.getTeamPermissions(
        context.userId,
        context.teamId
      )
      teamPermissions.forEach(p => permissions.add(p))
    }
    
    // 4. Add resource-specific permissions from shares
    if (context.resourceId && context.resourceType) {
      const sharePermissions = await this.getSharePermissions(
        context.userId,
        context.resourceId,
        context.resourceType
      )
      sharePermissions.forEach(p => permissions.add(p))
    }
    
    return permissions
  }
  
  /**
   * Check if a user has a specific permission in a given context
   */
  async hasPermission(
    userId: string,
    permission: PermissionValue,
    context?: {
      organizationId?: string
      teamId?: string
      resourceId?: string
      resourceType?: string
    }
  ): Promise<boolean> {
    const permissions = await this.calculatePermissions({
      userId,
      ...context
    })
    
    return permissions.has(permission)
  }
  
  /**
   * Get organization permissions based on membership role
   */
  private async getOrganizationPermissions(
    userId: string,
    organizationId: string
  ): Promise<string[]> {
    // TODO: Query database for membership
    // For now, return basic org member permissions
    const permissions = [
      PERMISSIONS.ORG_READ,
      PERMISSIONS.TEAM_READ,
      PERMISSIONS.TEAM_CREATE,
    ]
    
    // TODO: Add role-specific permissions based on membership role
    // - Owner: all permissions
    // - Admin: member management, team management
    // - Member: basic permissions
    
    return permissions
  }
  
  /**
   * Get team permissions based on membership role
   */
  private async getTeamPermissions(
    userId: string,
    teamId: string
  ): Promise<string[]> {
    // TODO: Query database for team membership
    // For now, return basic team member permissions
    const permissions = [
      PERMISSIONS.TEAM_READ,
    ]
    
    // TODO: Add role-specific permissions
    // - Manager: can invite, manage members
    // - Member: read-only
    
    return permissions
  }
  
  /**
   * Get permissions from resource shares
   */
  private async getSharePermissions(
    userId: string,
    resourceId: string,
    resourceType: string
  ): Promise<string[]> {
    // TODO: Query resource_shares table
    // For now, return empty array
    const permissions: string[] = []
    
    // TODO: Check if resource is shared with user directly
    // TODO: Check if resource is shared with user's teams
    // TODO: Check if resource is shared with user's organization
    
    return permissions
  }
  
  /**
   * Check if user can access a resource (read access)
   */
  async canAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    context?: {
      organizationId?: string
      teamId?: string
    }
  ): Promise<boolean> {
    // Owner always has access
    // TODO: Check if user is the owner
    
    // Check shared permissions
    const hasShareAccess = await this.hasPermission(
      userId,
      PERMISSIONS.SHARE_READ,
      {
        resourceId,
        resourceType,
        ...context
      }
    )
    
    if (hasShareAccess) return true
    
    // Check organization/team access
    if (context?.organizationId) {
      const hasOrgAccess = await this.hasPermission(
        userId,
        PERMISSIONS.ORG_READ,
        context
      )
      if (hasOrgAccess) return true
    }
    
    return false
  }
  
  /**
   * Check if user can modify a resource (write access)
   */
  async canModify(
    userId: string,
    resourceType: string,
    resourceId: string,
    context?: {
      organizationId?: string
      teamId?: string
    }
  ): Promise<boolean> {
    // Owner always has access
    // TODO: Check if user is the owner
    
    // Check shared permissions
    const hasShareAccess = await this.hasPermission(
      userId,
      PERMISSIONS.SHARE_WRITE,
      {
        resourceId,
        resourceType,
        ...context
      }
    )
    
    if (hasShareAccess) return true
    
    // Check organization/team admin permissions
    if (context?.organizationId) {
      const hasOrgAccess = await this.hasPermission(
        userId,
        PERMISSIONS.ORG_MEMBER_MANAGE,
        context
      )
      if (hasOrgAccess) return true
    }
    
    if (context?.teamId) {
      const hasTeamAccess = await this.hasPermission(
        userId,
        PERMISSIONS.TEAM_MANAGE,
        context
      )
      if (hasTeamAccess) return true
    }
    
    return false
  }
}

// Singleton instance
export const permissionService = new PermissionService()
