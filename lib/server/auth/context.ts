import "@/lib/server/only"

import { cache } from "react"
import { headers } from "next/headers"
import { logger } from "@/lib/server/logger"
import { HEADER_NAMES } from "@/lib/constants"
import { verifyNeonJwt, type NeonJwtPayload } from "@/lib/server/auth/jwt"
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

function extractNeonSessionInfo(sessionData: unknown): {
  userId: string | null
  sessionId: string | null
  sessionToken: string | null
  email: string | null
  name: string | null
  avatar: string | null
  provider: string | null
  emailVerified: boolean | null
  expiresAt: Date | null
} {
  if (!sessionData || typeof sessionData !== "object") {
    return {
      userId: null,
      sessionId: null,
      sessionToken: null,
      email: null,
      name: null,
      avatar: null,
      provider: null,
      emailVerified: null,
      expiresAt: null,
    }
  }

  const sd = sessionData as Record<string, unknown>
  const session = sd["session"] && typeof sd["session"] === "object" ? (sd["session"] as Record<string, unknown>) : null
  const user = sd["user"] && typeof sd["user"] === "object" ? (sd["user"] as Record<string, unknown>) : null

  const userId =
    (user && typeof user["id"] === "string" && user["id"]) ? (user["id"] as string)
      : (session && typeof session["userId"] === "string" && session["userId"]) ? (session["userId"] as string)
        : (session && typeof session["user_id"] === "string" && session["user_id"]) ? (session["user_id"] as string)
          : (session && typeof session["sub"] === "string" && session["sub"]) ? (session["sub"] as string)
            : null

  const sessionId =
    (session && typeof session["id"] === "string" && session["id"]) ? (session["id"] as string)
      : (session && typeof session["sessionId"] === "string" && session["sessionId"]) ? (session["sessionId"] as string)
        : null

  const sessionToken =
    (session && typeof session["token"] === "string" && session["token"]) ? (session["token"] as string)
      : null

  const email =
    (user && typeof user["email"] === "string" && user["email"]) ? (user["email"] as string)
      : null

  const name =
    (user && typeof user["name"] === "string" && user["name"]) ? (user["name"] as string)
      : null

  const avatar =
    (user && typeof user["image"] === "string" && user["image"]) ? (user["image"] as string)
      : (user && typeof user["avatar"] === "string" && user["avatar"]) ? (user["avatar"] as string)
        : null

  const provider =
    (user && typeof user["provider"] === "string" && user["provider"]) ? (user["provider"] as string)
      : null

  const emailVerified =
    (user && typeof user["emailVerified"] === "boolean") ? (user["emailVerified"] as boolean)
      : (user && typeof user["email_verified"] === "boolean") ? (user["email_verified"] as boolean)
        : null

  const expiresRaw =
    (session && (session["expiresAt"] ?? session["expires_at"] ?? session["expires"])) ?? null
  const expiresAt = (() => {
    if (expiresRaw instanceof Date) return expiresRaw
    if (typeof expiresRaw === "string" || typeof expiresRaw === "number") {
      const d = new Date(expiresRaw)
      return Number.isNaN(d.getTime()) ? null : d
    }
    return null
  })()

  return {
    userId,
    sessionId,
    sessionToken,
    email,
    name,
    avatar,
    provider,
    emailVerified,
    expiresAt,
  }
}

/**
 * Check if a token should be refreshed (< 10 minutes remaining)
 * This is more aggressive than the previous 15 minutes to ensure
 * proactive refresh before user experiences token expiration
 */
export function shouldRefreshToken(expiresAt: number): boolean {
  const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
  return expiresIn < 600 // Refresh if < 10 minutes (600 seconds)
}

function isNextStaticGenerationDynamicUsageError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false

  const anyErr = err as { digest?: unknown; message?: unknown; description?: unknown }
  if (anyErr.digest === "DYNAMIC_SERVER_USAGE") return true

  const message = typeof anyErr.message === "string" ? anyErr.message : ""
  const description = typeof anyErr.description === "string" ? anyErr.description : ""

  return (
    message.includes("Dynamic server usage") ||
    description.includes("Dynamic server usage") ||
    message.includes("outside a request scope")
  )
}

/**
 * Get authentication context for the current request
 * 
 * Memoized with React cache to prevent duplicate JWT verification
 * and database queries during the same request lifecycle
 */
export const getAuthContext = cache(async function getAuthContext(): Promise<AuthContext> {
  try {
    const headersList = await headers()
    const authHeader = headersList.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    const token = tokenFromHeader

    // Prefer explicit bearer token (service-to-service / API calls), otherwise
    // resolve the Neon Auth session via the official server API.
    const neonSession = token ? null : await auth.getSession()
    const neonSessionData = neonSession && "data" in neonSession ? neonSession.data : null
    const extracted = extractNeonSessionInfo(neonSessionData)
    const sessionToken = token ?? extracted.sessionToken ?? null
    const sessionId = extracted.sessionId ?? undefined

    if (!sessionToken && !extracted.userId) {
      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    // Prefer JWT verification when a JWT is available (useful for Data API / roles claim).
    // But do NOT require the session token to be a JWT: Neon Auth sessions may be opaque.
    const verified = sessionToken ? await verifyNeonJwt(sessionToken) : null

    if (!verified) {
      const headerUserId = headersList.get(HEADER_NAMES.USER_ID)
      if (headerUserId) {
        return {
          userId: headerUserId,
          sessionId,
          roles: ["user"],
          authSource: "header",
          isAuthenticated: true,
        }
      }

      // If Neon Auth session is present but token is opaque, trust the server session payload.
      if (extracted.userId) {
        const userId = extracted.userId
        const email = extracted.email ?? undefined
        const name = extracted.name ?? undefined
        const avatar = extracted.avatar ?? undefined
        const provider = extracted.provider ?? undefined
        const emailVerified = extracted.emailVerified ?? false

        let syncResult: Awaited<ReturnType<typeof syncUserFromAuth>> | null = null
        try {
          syncResult = await syncUserFromAuth({ id: userId, email, name, avatar, provider, emailVerified })
        } catch (syncError) {
          logger.warn({ err: syncError, userId }, "Failed to sync user from Neon Auth")
        }

        const role = syncResult?.role ?? "user"
        const roles = role ? [role] : ["user"]

        const tokenExpiresAt = extracted.expiresAt ?? undefined
        const shouldRefresh = tokenExpiresAt ? tokenExpiresAt.getTime() - Date.now() < 10 * 60 * 1000 : false

        return {
          userId,
          sessionId,
          email: syncResult?.email ?? email,
          roles,
          authSource: "neon-auth",
          isAuthenticated: true,
          tokenExpiresAt,
          shouldRefresh,
        }
      }

      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    const payload = verified.payload as NeonJwtPayload
    const userId = payload.sub

    if (!userId) {
      logger.error("JWT validation passed but 'sub' claim is missing")
      return {
        userId: "",
        roles: [],
        authSource: "anonymous",
        isAuthenticated: false,
      }
    }

    // Extract email from JWT payload (prefer JWT claim over fallback)
    const email = payload.email ?? extracted.email ?? undefined

    // Extract display name from JWT payload
    const name = payload.name ?? extracted.name ?? undefined

    // Extract avatar from JWT payload
    const avatar = payload.picture ?? extracted.avatar ?? undefined

    // Extract provider from JWT payload
    const provider = payload.provider ?? (payload.iss as string | undefined)

    // Check email verification status
    const emailVerified = payload.email_verified ?? extracted.emailVerified ?? false

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

    // Extract roles from JWT payload (standard claim) or fallback to single role
    const roles = Array.isArray(payload.roles)
      ? payload.roles
      : role
        ? [role]
        : ["user"]

    // Extract token expiration
    const tokenExpiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined
    const shouldRefresh = payload.exp ? shouldRefreshToken(payload.exp) : false

    // Log successful login (fire and forget) for every authenticated session
    logLogin(userId, {
      provider,
      sessionId,
      ipAddress: extractIpAddress(headersList),
      userAgent: extractUserAgent(headersList),
    }).catch((err) => logger.warn({ err }, "Failed to log login event"))

    return {
      userId,
      sessionId,
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
})
