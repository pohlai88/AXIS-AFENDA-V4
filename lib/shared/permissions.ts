export type Permission = `${string}.${string}`

export type Role = "owner" | "admin" | "member" | "viewer"

export type AuthzContext = {
  roles: Role[]
  permissions?: Permission[]
}

export function can(ctx: AuthzContext, permission: Permission) {
  // Strict by default: if you don't have explicit permissions, you don't have access.
  if (!ctx.permissions) return false
  return ctx.permissions.includes(permission)
}

