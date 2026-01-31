import { z } from "zod"

export const PermissionSchema = z.string().regex(/^[a-z]+\.[a-z]+$/)
export type Permission = z.infer<typeof PermissionSchema>

export const RoleSchema = z.enum(["owner", "admin", "member", "viewer"])
export type Role = z.infer<typeof RoleSchema>

export const AuthorizationContextSchema = z.object({
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema).optional(),
})
export type AuthorizationContext = z.infer<typeof AuthorizationContextSchema>

/**
 * Checks if the given authorization context grants the specified permission.
 * 
 * @param ctx - The authorization context containing roles and permissions
 * @param permission - The permission to check (format: "resource.action")
 * @returns True if the permission is granted, false otherwise
 * 
 * @example
 * ```typescript
 * const ctx: AuthorizationContext = { 
 *   roles: ['admin'], 
 *   permissions: ['users.read', 'users.write'] 
 * }
 * hasPermission(ctx, 'users.read') // true
 * ```
 */
export function hasPermission(ctx: AuthorizationContext, permission: Permission): boolean {
  // Strict by default: if you don't have explicit permissions, you don't have access.
  if (!ctx.permissions) return false
  return ctx.permissions.includes(permission)
}

// Legacy export for backward compatibility
/** @deprecated Use hasPermission() instead */
export const can = hasPermission
