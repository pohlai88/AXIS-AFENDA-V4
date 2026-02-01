import "@/lib/server/only"

import { headers } from "next/headers"
import { logger } from "@/lib/server/logger"
import { HEADER_NAMES, COOKIE_NAMES } from "@/lib/constants"
import { verifyNeonJwt } from "@/lib/server/auth/jwt"
import { syncUserFromAuth } from "@/lib/server/auth/user-sync"
import { logLogin, extractIpAddress, extractUserAgent } from "@/lib/server/auth/audit-log"

export interface AuthContext {
  userId: string
  sessionId?: string
  email?: string
  roles: string[]
  authSource: "neon-auth" | "header" | "anonymous"
  isAuthenticated: boolean
  tokenExpiresAt?: Date
  shouldRefresh?: boolean
}

/**
 * Check if a token should be refreshed (< 15 minutes remaining)
 */
export function shouldRefreshToken(expiresAt: number): boolean {
  const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
  return expiresIn < 900 // Refresh if < 15 minutes (900 seconds)
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const headersList = await headers()
    const authHeader = headersList.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    const tokenFromCookie = extractNeonAuthCookie(headersList.get("cookie"))
    const token = tokenFromHeader ?? tokenFromCookie

    if (!token) {
      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    const verified = await verifyNeonJwt(token)

    if (!verified) {
      const headerUserId = headersList.get(HEADER_NAMES.USER_ID)
      if (headerUserId) {
        return {
          userId: headerUserId,
          sessionId: token,
          roles: ["user"],
          authSource: "header",
          isAuthenticated: true,
        }
      }

      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    const payload = verified.payload
    const claims = payload as Record<string, unknown>
    const userId = (payload.sub ?? claims.user_id ?? claims.userId) as string | undefined

    if (!userId) {
      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    const email = (payload.email ?? claims.email_address) as string | undefined
    const name = (payload.name ?? claims.preferred_username) as string | undefined
    const avatar = (payload.picture ?? claims.avatar_url) as string | undefined
    const provider = (claims.provider ?? payload.iss) as string | undefined
    const emailVerified = Boolean(claims.email_verified)

    let syncResult: Awaited<ReturnType<typeof syncUserFromAuth>> | null = null

    try {
      syncResult = await syncUserFromAuth({
        id: userId,
        email,
        name,
        avatar,
        provider,
        emailVerified,
      })
    } catch (syncError) {
      logger.warn({ err: syncError, userId }, "Failed to sync user from Neon Auth")
    }

    const role = syncResult?.role ?? "user"
    const roles = Array.isArray(claims.roles)
      ? (claims.roles as string[])
      : claims.role
        ? [String(claims.role)]
        : [role]

    // Extract token expiration
    const tokenExpiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined
    const shouldRefresh = payload.exp ? shouldRefreshToken(payload.exp) : false

    // Log successful login (fire and forget)
    if (syncResult?.created) {
      // New user signup
      logLogin(userId, {
        provider,
        sessionId: token,
        ipAddress: extractIpAddress(headersList),
        userAgent: extractUserAgent(headersList),
      }).catch((err) => logger.warn({ err }, "Failed to log signup event"))
    }

    return {
      userId,
      sessionId: token,
      email: syncResult?.email ?? email,
      roles,
      authSource: "neon-auth",
      isAuthenticated: true,
      tokenExpiresAt,
      shouldRefresh,
    }
  } catch (error) {
    logger.error({ err: error }, "Error getting auth context")
    return {
      userId: "",
      roles: [],
      authSource: "anonymous",
      isAuthenticated: false,
    }
  }
}

function extractNeonAuthCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim())
  const neonCookie = cookies.find((cookie) => cookie.startsWith(COOKIE_NAMES.NEON_AUTH))

  if (!neonCookie) return null

  const value = neonCookie.split("=")[1]
  if (!value) return null

  return decodeURIComponent(value)
}
