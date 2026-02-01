import "@/lib/server/only"

import { headers } from "next/headers"
import { logger } from "@/lib/server/logger"
import { HEADER_NAMES } from "@/lib/constants"
import { verifyNeonJwt } from "@/lib/server/auth/jwt"
import { syncUserFromAuth } from "@/lib/server/auth/user-sync"
import { logLogin, extractIpAddress, extractUserAgent } from "@/lib/server/auth/audit-log"
import { auth } from "@/lib/auth/server"

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

function isNextStaticGenerationDynamicUsageError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false

  const anyErr = err as { digest?: unknown; message?: unknown; description?: unknown }
  if (anyErr.digest === "DYNAMIC_SERVER_USAGE") return true

  const message = typeof anyErr.message === "string" ? anyErr.message : ""
  const description = typeof anyErr.description === "string" ? anyErr.description : ""

  return message.includes("Dynamic server usage") || description.includes("Dynamic server usage")
}

export async function getAuthContext(): Promise<AuthContext> {
  try {
    const headersList = await headers()
    const authHeader = headersList.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    const token = tokenFromHeader

    // Prefer explicit bearer token (service-to-service / API calls), otherwise
    // resolve the Neon Auth session via the official server API.
    const neonSession = token ? null : await auth.getSession()
    const neonSessionData = neonSession && "data" in neonSession ? neonSession.data : null
    const sessionToken = token ?? neonSessionData?.session?.token ?? null

    if (!sessionToken) {
      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    // IMPORTANT: verify the JWT token from the session. The Neon Auth cookie
    // itself is not guaranteed to be a JWT (and may be opaque/encrypted).
    const verified = await verifyNeonJwt(sessionToken)

    if (!verified) {
      const headerUserId = headersList.get(HEADER_NAMES.USER_ID)
      if (headerUserId) {
        return {
          userId: headerUserId,
          sessionId: sessionToken,
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
    const userId =
      ((payload.sub ?? claims.user_id ?? claims.userId ?? neonSessionData?.user?.id) as string | undefined) ?? undefined

    if (!userId) {
      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    const email =
      ((payload.email ?? claims.email_address ?? neonSessionData?.user?.email) as string | undefined) ?? undefined
    const name =
      ((payload.name ?? claims.preferred_username ?? neonSessionData?.user?.name) as string | undefined) ?? undefined
    const avatar =
      ((payload.picture ?? claims.avatar_url ?? neonSessionData?.user?.image) as string | undefined) ?? undefined
    const provider = (claims.provider ?? payload.iss) as string | undefined
    const emailVerified = Boolean(claims.email_verified ?? neonSessionData?.user?.emailVerified)

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
        sessionId: sessionToken,
        ipAddress: extractIpAddress(headersList),
        userAgent: extractUserAgent(headersList),
      }).catch((err) => logger.warn({ err }, "Failed to log signup event"))
    }

    return {
      userId,
      sessionId: sessionToken,
      email: syncResult?.email ?? email,
      roles,
      authSource: "neon-auth",
      isAuthenticated: true,
      tokenExpiresAt,
      shouldRefresh,
    }
  } catch (error) {
    // During build-time static generation, calling request-bound APIs like `headers()`
    // throws `DYNAMIC_SERVER_USAGE`. That's expected and should not be logged as an error.
    if (isNextStaticGenerationDynamicUsageError(error)) {
      logger.debug({ err: error }, "Auth context unavailable during static generation")
    } else {
      logger.error({ err: error }, "Error getting auth context")
    }
    return {
      userId: "",
      roles: [],
      authSource: "anonymous",
      isAuthenticated: false,
    }
  }
}
