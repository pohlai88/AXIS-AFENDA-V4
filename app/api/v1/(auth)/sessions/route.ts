/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/v1/sessions
 */

import "@/lib/server/only"

import { headers, cookies } from "next/headers"
import { NextResponse } from "next/server"

import { HEADER_NAMES, COOKIE_NAMES } from "@/lib/constants"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { getAuthContext } from "@/lib/server/auth/context"
import { getUserActiveSessions, revokeAllOtherSessions } from "@/lib/server/auth/session-helpers"
import { sessionListResponseSchema, revokeAllSessionsResponseSchema } from "@/lib/contracts/sessions"
import { logger } from "@/lib/server/logger"

/**
 * GET /api/v1/sessions
 * List all active sessions for the authenticated user
 */
export async function GET() {
  const h = await headers()
  const requestId = h.get(HEADER_NAMES.REQUEST_ID)

  try {    // Get auth context
    const auth = await getAuthContext()
    if (!auth.isAuthenticated || !auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    // Get current session token from cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAMES.NEON_AUTH)
    const currentSessionToken = sessionCookie?.value

    // Fetch active sessions
    const sessions = await getUserActiveSessions(auth.userId, currentSessionToken)

    // Format response
    const response = sessionListResponseSchema.parse({
      sessions: sessions.map((session) => ({
        id: session.id,
        device: session.device,
        browser: session.browser,
        os: session.os,
        ipAddress: session.ipAddress,
        lastActive: session.lastActive.toISOString(),
        expires: session.expires.toISOString(),
        createdAt: session.createdAt.toISOString(),
        isCurrent: session.isCurrent,
      })),
      total: sessions.length,
    })

    logger.info({ userId: auth.userId, count: sessions.length, requestId }, "Retrieved user sessions")

    return ok(response)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(error.toApiError(requestId ?? undefined), error.status)
    }

    logger.error({ error }, "Failed to retrieve user sessions")
    return fail({ code: "INTERNAL_ERROR", message: "Failed to retrieve sessions", requestId: requestId ?? undefined }, 500)
  }
}

/**
 * DELETE /api/v1/sessions
 * Revoke all other sessions except the current one
 */
export async function DELETE() {
  const h = await headers()
  const requestId = h.get(HEADER_NAMES.REQUEST_ID)

  try {    // Get auth context
    const auth = await getAuthContext()
    if (!auth.isAuthenticated || !auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    // Get current session token from cookie
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAMES.NEON_AUTH)
    const currentSessionToken = sessionCookie?.value

    if (!currentSessionToken) {
      throw new HttpError(400, "BAD_REQUEST", "Current session not found")
    }

    // Revoke all other sessions
    const revokedCount = await revokeAllOtherSessions(auth.userId, currentSessionToken)

    const response = revokeAllSessionsResponseSchema.parse({
      success: true,
      revokedCount,
      message: `Successfully revoked ${revokedCount} session(s)`,
    })

    logger.info(
      { userId: auth.userId, revokedCount, requestId },
      "Revoked all other sessions for user"
    )

    return ok(response)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(error.toApiError(requestId ?? undefined), error.status)
    }

    logger.error({ error }, "Failed to revoke other sessions")
    return fail({ code: "INTERNAL_ERROR", message: "Failed to revoke sessions", requestId: requestId ?? undefined }, 500)
  }
}

