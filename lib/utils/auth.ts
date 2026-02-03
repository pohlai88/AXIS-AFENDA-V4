import { REGEX_PATTERNS } from "@/lib/constants"

export type UserRole = "user" | "admin" | "moderator"

export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  username?: string | null
  role?: UserRole
}

// Note: Server-side auth is handled via lib/server/auth/context.ts (getAuthContext)
// This file contains client-side utilities and validation helpers

export function hasRole(user: AuthUser, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    user: 0,
    moderator: 1,
    admin: 2,
  }

  const userRoleLevel = roleHierarchy[user.role || "user"]
  const requiredRoleLevel = roleHierarchy[requiredRole]

  return userRoleLevel >= requiredRoleLevel
}

export function canAccessResource(user: AuthUser, resource: string): boolean {
  switch (resource) {
    case "admin":
      return user.role === "admin"
    case "moderator":
      return user.role === "admin" || user.role === "moderator"
    case "user":
      return !!user.id
    default:
      return true
  }
}

// Password validation
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!REGEX_PATTERNS.PASSWORD.test(password)) {
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter")
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter")
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number")
    }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Email validation
export function validateEmail(email: string): boolean {
  return REGEX_PATTERNS.EMAIL.test(email)
}

// Username validation
export function validateUsername(username: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long")
  }

  if (username.length > 50) {
    errors.push("Username must be less than 50 characters long")
  }

  if (!REGEX_PATTERNS.USERNAME.test(username)) {
    errors.push("Username can only contain letters, numbers, underscores, and hyphens")
  }

  if (/^[0-9]/.test(username)) {
    errors.push("Username cannot start with a number")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Generate secure random string
export function generateSecureToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}
