/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/v1/sessions/:id
 */

import "@/lib/server/only"

import { headers } from "next/headers"
import { NextResponse } from "next/server"

import { HEADER_NAMES } from "@/lib/constants"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { getAuthContext } from "@/lib/server/auth/context"
import { revokeSession } from "@/lib/server/auth/session-helpers"
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

    // Revoke the session
    const success = await revokeSession(id, auth.userId)

    if (!success) {
      throw new HttpError(404, "NOT_FOUND", "Session not found or already revoked")
    }

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

