/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/v1/sessions/:id
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { getAuthContext } from "@/lib/server/auth/context"
import { listNeonSessions, revokeNeonSession } from "@/lib/server/auth/neon-sessions"
import { sessionIdParamSchema, revokeSessionResponseSchema } from "@/lib/contracts/sessions"
import { logger } from "@/lib/server/logger"

type Params = Promise<{
  id: string
}>

/**
 * DELETE /api/v1/sessions/[id]
 * Revoke a specific session by ID
 */
export async function DELETE(_request: Request, segmentData: { params: Params }) {
  const h = await headers()
  const requestId = h.get(HEADER_NAMES.REQUEST_ID)

  try {    // Get auth context
    const auth = await getAuthContext()
    if (!auth.isAuthenticated || !auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    // Validate session ID from params
    const params = await segmentData.params
    const { id } = sessionIdParamSchema.parse({ id: params.id })

    // Prevent revoking the current session via this endpoint.
    const { sessions } = await listNeonSessions()
    const current = sessions.find((s) => s.isCurrent)
    if (current?.id && current.id === id) {
      throw new HttpError(400, "BAD_REQUEST", "Cannot revoke current session. Use /api/auth/logout instead.")
    }

    await revokeNeonSession(id)

    const response = revokeSessionResponseSchema.parse({
      success: true,
      message: "Session revoked successfully",
    })

    logger.info({ userId: auth.userId, sessionId: id, requestId }, "Session revoked")

    return ok(response)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail(error.toApiError(requestId ?? undefined), error.status)
    }

    logger.error({ error }, "Failed to revoke session")
    return fail({ code: "INTERNAL_ERROR", message: "Failed to revoke session", requestId: requestId ?? undefined }, 500)
  }
}

