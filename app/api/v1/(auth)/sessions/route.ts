/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/v1/sessions
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { getAuthContext } from "@/lib/server/auth/context"
import { listNeonSessions, revokeOtherNeonSessions } from "@/lib/server/auth/neon-sessions"
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

    const { sessions } = await listNeonSessions()

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

    const { sessions } = await listNeonSessions()
    const revokedCount = sessions.filter((s) => !s.isCurrent).length

    await revokeOtherNeonSessions()

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

