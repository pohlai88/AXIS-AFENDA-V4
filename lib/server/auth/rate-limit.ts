import "@/lib/server/only"

import { loginAttempts } from "@/lib/server/db/schema"
import { and, desc, eq, gt, sql } from "drizzle-orm"
import { getDb } from "@/lib/server/db"

export type RateLimitScope = "email" | "ip"

export interface RateLimitStatus {
  allowed: boolean
  remainingAttempts: number
  requiresCaptcha: boolean
  lockedUntil?: Date
  retryAfterSeconds?: number
}

const RATE_LIMIT_CONFIG = {
  email: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    lockoutMs: 15 * 60 * 1000, // 15 minutes
    captchaAfter: 3,
  },
  ip: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 10,
    lockoutMs: 60 * 60 * 1000, // 1 hour
    captchaAfter: 3,
  },
} as const

function buildIdentifier(scope: RateLimitScope, value: string): string {
  return `${scope}:${value}`
}

function getRetryAfterSeconds(lockedUntil?: Date): number | undefined {
  if (!lockedUntil) return undefined
  const ms = lockedUntil.getTime() - Date.now()
  return ms > 0 ? Math.ceil(ms / 1000) : undefined
}

export class RateLimiter {
  async checkLoginAttempt(scope: RateLimitScope, value: string): Promise<RateLimitStatus> {
    const db = getDb()
    const identifier = buildIdentifier(scope, value)
    const config = RATE_LIMIT_CONFIG[scope]
    const now = new Date()
    const windowStart = new Date(Date.now() - config.windowMs)

    const [latest] = await db
      .select()
      .from(loginAttempts)
      .where(and(eq(loginAttempts.identifier, identifier), gt(loginAttempts.windowStart, windowStart)))
      .orderBy(desc(loginAttempts.windowStart))
      .limit(1)

    if (!latest) {
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        requiresCaptcha: false,
      }
    }

    if (latest.lockedUntil && latest.lockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        requiresCaptcha: true,
        lockedUntil: latest.lockedUntil,
        retryAfterSeconds: getRetryAfterSeconds(latest.lockedUntil),
      }
    }

    const remainingAttempts = Math.max(0, config.maxAttempts - latest.attempts)
    const requiresCaptcha = latest.attempts >= config.captchaAfter

    return {
      allowed: remainingAttempts > 0,
      remainingAttempts,
      requiresCaptcha,
    }
  }

  async recordFailedLogin(scope: RateLimitScope, value: string): Promise<RateLimitStatus> {
    const db = getDb()
    const identifier = buildIdentifier(scope, value)
    const config = RATE_LIMIT_CONFIG[scope]
    const now = new Date()
    const windowStart = new Date(Date.now() - config.windowMs)

    const newLockedUntil = new Date(now.getTime() + config.lockoutMs)

    // Concurrency-safe update:
    // - Require a UNIQUE index on `identifier` (added via migration).
    // - Within the active window, increment attempts atomically.
    // - Outside window, reset attempts/windowStart/lockedUntil.
    const [row] = await db
      .insert(loginAttempts)
      .values({
        identifier,
        attempts: 1,
        windowStart: now,
        lockedUntil: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: loginAttempts.identifier,
        set: {
          attempts: sql<number>`
            case
              when ${loginAttempts.windowStart} <= ${windowStart} then 1
              else ${loginAttempts.attempts} + 1
            end
          `,
          windowStart: sql<Date>`
            case
              when ${loginAttempts.windowStart} <= ${windowStart} then ${now}
              else ${loginAttempts.windowStart}
            end
          `,
          lockedUntil: sql<Date | null>`
            case
              when ${loginAttempts.windowStart} <= ${windowStart} then null
              else case
                when (${loginAttempts.attempts} + 1) >= ${config.maxAttempts} then ${newLockedUntil}
                else null
              end
            end
          `,
          updatedAt: now,
        },
      })
      .returning({
        attempts: loginAttempts.attempts,
        lockedUntil: loginAttempts.lockedUntil,
      })

    const attempts = row?.attempts ?? 1
    const lockedUntil = row?.lockedUntil ?? undefined

    const isLocked = Boolean(lockedUntil && lockedUntil > now)
    const remainingAttempts = isLocked ? 0 : Math.max(0, config.maxAttempts - attempts)
    const requiresCaptcha = attempts >= config.captchaAfter

    return {
      allowed: !isLocked && remainingAttempts > 0,
      remainingAttempts,
      requiresCaptcha,
      lockedUntil,
      retryAfterSeconds: getRetryAfterSeconds(lockedUntil),
    }
  }

  async resetLoginAttempts(scope: RateLimitScope, value: string): Promise<void> {
    const db = getDb()
    const identifier = buildIdentifier(scope, value)
    await db.delete(loginAttempts).where(eq(loginAttempts.identifier, identifier))
  }
}

export async function checkLoginEligibility(params: {
  email?: string
  ipAddress?: string
}): Promise<{ allowed: boolean; requiresCaptcha: boolean; retryAfterSeconds?: number }> {
  const limiter = new RateLimiter()
  const { email, ipAddress } = params

  const results: RateLimitStatus[] = []

  if (email) {
    results.push(await limiter.checkLoginAttempt("email", email))
  }

  if (ipAddress) {
    results.push(await limiter.checkLoginAttempt("ip", ipAddress))
  }

  const blocked = results.find((result) => !result.allowed)
  const requiresCaptcha = results.some((result) => result.requiresCaptcha)

  return {
    allowed: !blocked,
    requiresCaptcha,
    retryAfterSeconds: blocked?.retryAfterSeconds,
  }
}

export async function recordFailedLoginAttempt(params: { email?: string; ipAddress?: string }) {
  const limiter = new RateLimiter()
  const { email, ipAddress } = params
  const result: { email?: RateLimitStatus; ip?: RateLimitStatus } = {}

  if (email) {
    result.email = await limiter.recordFailedLogin("email", email)
  }

  if (ipAddress) {
    result.ip = await limiter.recordFailedLogin("ip", ipAddress)
  }

  return result
}

export async function resetLoginAttempts(params: { email?: string; ipAddress?: string }) {
  const limiter = new RateLimiter()
  const { email, ipAddress } = params

  if (email) {
    await limiter.resetLoginAttempts("email", email)
  }

  if (ipAddress) {
    await limiter.resetLoginAttempts("ip", ipAddress)
  }
}
