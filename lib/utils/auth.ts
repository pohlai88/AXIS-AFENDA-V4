import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { cache } from "react"

import { REGEX_PATTERNS, STORAGE_KEYS, TIME_INTERVALS } from "@/lib/constants"

export type UserRole = "user" | "admin" | "moderator"

export interface AuthUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  username?: string | null
  role?: UserRole
}

// Server-side auth utilities
export const getServerAuthSession = cache(async () => {
  return await getServerSession()
})

export async function requireAuth(): Promise<AuthUser> {
  const session = await getServerAuthSession()
  
  if (!session?.user) {
    redirect("/login")
  }

  return session.user as AuthUser
}

export async function requireRole(requiredRole: UserRole): Promise<AuthUser> {
  const user = await requireAuth()
  
  if (!hasRole(user, requiredRole)) {
    redirect("/auth/unauthorized")
  }

  return user
}

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

// Client-side auth utilities
export function getAuthHeaders(): Record<string, string> {
  if (typeof window !== "undefined") {
    const userId = localStorage.getItem(STORAGE_KEYS.USER.ID)
    const userRole = localStorage.getItem(STORAGE_KEYS.USER.ROLE)
    
    return {
      "x-user-id": userId || "",
      "x-user-role": userRole || "user",
    }
  }
  
  return {}
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

// Rate limiting utilities
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map()

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * TIME_INTERVALS.MINUTE
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const record = this.attempts.get(identifier)

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return true
    }

    if (record.count >= this.maxAttempts) {
      return false
    }

    record.count++
    return true
  }

  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts
    }
    return Math.max(0, this.maxAttempts - record.count)
  }

  getResetTime(identifier: string): number | null {
    const record = this.attempts.get(identifier)
    if (!record || Date.now() > record.resetTime) {
      return null
    }
    return record.resetTime
  }
}

// Global rate limiters
export const loginRateLimiter = new RateLimiter(5, 15 * TIME_INTERVALS.MINUTE) // 5 attempts per 15 minutes
export const registerRateLimiter = new RateLimiter(3, TIME_INTERVALS.HOUR) // 3 attempts per hour
export const passwordResetRateLimiter = new RateLimiter(3, TIME_INTERVALS.HOUR) // 3 attempts per hour
