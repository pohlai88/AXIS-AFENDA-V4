/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/auth/sessions
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"
import { getAuthContext } from "@/lib/server/auth/context"
import { getUserActiveSessions, revokeSession, revokeAllOtherSessions } from "@/lib/server/auth/session-helpers"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { ok, fail } from "@/lib/server/api/response"

/**
 * GET /api/auth/sessions
 * 
 * Returns all active sessions for the authenticated user
 * 
 * Response:
 * {
 *   data: { sessions: SessionInfo[] }
 *   error: null
 * }
 */
export async function GET(request: NextRequest) {
  return withApiErrorBoundary(request, async (log, requestId) => {
    const authContext = await getAuthContext()

    if (!authContext.isAuthenticated || !authContext.userId) {
      return fail(
        { code: "UNAUTHORIZED", message: "User not authenticated" },
        401
      )
    }

    const sessions = await getUserActiveSessions(authContext.userId, authContext.sessionId)

    log.info({ userId: authContext.userId, sessionCount: sessions.length, requestId }, "Sessions retrieved")

    return ok({ sessions }, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 60 seconds (user-specific data)
      },
    })
  })
}

/**
 * POST /api/auth/sessions/:action
 * 
 * Actions:
 * - revoke-session: Revoke a specific session by ID
 * - revoke-all-others: Revoke all sessions except current
 * 
 * Request body:
 * {
 *   sessionId?: string (required for revoke-session)
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   message: string
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  return withApiErrorBoundary(request, async (log, requestId) => {
    const authContext = await getAuthContext()

    if (!authContext.isAuthenticated || !authContext.userId) {
      return fail(
        { code: "UNAUTHORIZED", message: "User not authenticated" },
        401
      )
    }

    const body = await request.json().catch(() => ({}))
    const url = new URL(request.url)
    const action = url.searchParams.get("action") || body.action

    if (!action) {
      return fail(
        { code: "BAD_REQUEST", message: "Missing action parameter (revoke-session or revoke-all-others)" },
        400
      )
    }

    // Revoke specific session by ID
    if (action === "revoke-session") {
      const { sessionId } = body

      if (!sessionId || typeof sessionId !== "string") {
        return fail(
          { code: "BAD_REQUEST", message: "Missing or invalid sessionId in request body" },
          400
        )
      }

      // Prevent users from revoking their current session via this endpoint
      // (they should use the logout endpoint instead)
      if (sessionId === authContext.sessionId) {
        return fail(
          { code: "BAD_REQUEST", message: "Cannot revoke current session. Use /api/auth/logout instead." },
          400
        )
      }

      const revoked = await revokeSession(sessionId, authContext.userId)

      if (!revoked) {
        return fail(
          { code: "NOT_FOUND", message: "Session not found or you do not have permission to revoke it" },
          404
        )
      }

      log.info({ userId: authContext.userId, sessionId, requestId }, "Session revoked by user")

      return ok({ success: true, message: "Session revoked successfully" }, { status: 200 })
    }

    // Revoke all sessions except current
    if (action === "revoke-all-others") {
      if (!authContext.sessionId) {
        return fail(
          { code: "INTERNAL", message: "Current session token not available" },
          500
        )
      }

      const revokedCount = await revokeAllOtherSessions(authContext.userId, authContext.sessionId)

      log.info(
        { userId: authContext.userId, revokedCount, requestId },
        "All other sessions revoked by user"
      )

      return ok(
        { success: true, message: `Revoked ${revokedCount} other session(s)` },
        { status: 200 }
      )
    }

    return fail(
      { code: "BAD_REQUEST", message: `Unknown action: ${action}. Use 'revoke-session' or 'revoke-all-others'` },
      400
    )
  })
}
