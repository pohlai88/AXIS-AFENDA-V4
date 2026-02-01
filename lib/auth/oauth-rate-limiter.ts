/**
 * OAuth Rate Limiting Middleware
 * Implements rate limiting for OAuth endpoints to prevent abuse
 */

import { NextRequest, NextResponse } from "next/server"
import { OAUTH_RATE_LIMIT_CONFIG } from "@/lib/auth/oauth-config"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting
// For production, use Redis or a database
const rateLimitStore: RateLimitStore = {}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, value] of Object.entries(rateLimitStore)) {
    if (value.resetTime < now) {
      delete rateLimitStore[key]
    }
  }
}

/**
 * Get client identifier (IP or session)
 */
function getClientId(request: NextRequest): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  return ip
}

/**
 * Check and update rate limit for a client
 */
function checkRateLimit(
  clientId: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = clientId

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    }
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: rateLimitStore[key].resetTime,
    }
  }

  const entry = rateLimitStore[key]

  // Reset if window expired
  if (entry.resetTime < now) {
    entry.count = 1
    entry.resetTime = now + windowMs
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }

  // Check if limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limiting middleware for OAuth endpoints
 */
export function createOAuthRateLimiter(
  configKey: keyof typeof OAUTH_RATE_LIMIT_CONFIG
) {
  return async (request: NextRequest) => {
    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      cleanupRateLimitStore()
    }

    const config = OAUTH_RATE_LIMIT_CONFIG[configKey]
    const clientId = getClientId(request)

    const rateLimitResult = checkRateLimit(
      clientId,
      config.windowMs,
      config.max
    )

    // Add rate limit headers to response
    const response = (await request) as any

    response.headers.set("X-RateLimit-Limit", String(config.max))
    response.headers.set(
      "X-RateLimit-Remaining",
      String(rateLimitResult.remaining)
    )
    response.headers.set(
      "X-RateLimit-Reset",
      String(Math.ceil(rateLimitResult.resetTime / 1000))
    )

    if (!rateLimitResult.allowed) {
      console.warn(
        `⚠️ OAuth rate limit exceeded for ${clientId} on ${configKey}`
      )

      return NextResponse.json(
        { error: config.message },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(config.max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(
              Math.ceil(rateLimitResult.resetTime / 1000)
            ),
            "Retry-After": String(
              Math.ceil(
                (rateLimitResult.resetTime - Date.now()) / 1000
              )
            ),
          },
        }
      )
    }

    return response
  }
}

/**
 * Get current rate limit statistics
 */
export function getRateLimitStats() {
  return {
    totalTrackedClients: Object.keys(rateLimitStore).length,
    entries: Object.entries(rateLimitStore).map(([clientId, data]) => ({
      clientId,
      requestCount: data.count,
      resetTime: new Date(data.resetTime).toISOString(),
      timeUntilReset: Math.max(0, data.resetTime - Date.now()),
    })),
  }
}

/**
 * Reset rate limit for a specific client (admin only)
 */
export function resetRateLimit(clientId: string) {
  delete rateLimitStore[clientId]
}

/**
 * Reset all rate limits (admin only)
 */
export function resetAllRateLimits() {
  for (const key of Object.keys(rateLimitStore)) {
    delete rateLimitStore[key]
  }
}
