/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/auth/logout
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"
import { getAuthContext } from '@/lib/server/auth/context'
import { logAuthEvent } from '@/lib/server/auth/audit-log'
import { logger } from '@/lib/server/logger'
import { fail, ok } from "@/lib/server/api/response"
import { withApiErrorBoundary } from "@/lib/server/api/handler"

export async function POST(request: NextRequest) {
  return withApiErrorBoundary(request, async () => {
    const authContext = await getAuthContext()

    if (!authContext.isAuthenticated || !authContext.sessionId) {
      return fail({ code: "UNAUTHORIZED", message: "Not authenticated" }, 401)
    }

    // Log logout event
    await logAuthEvent({
      userId: authContext.userId!,
      action: 'logout',
      success: true,
      metadata: {
        sessionId: authContext.sessionId,
        authSource: authContext.authSource,
      },
    })

    logger.info({
      userId: authContext.userId,
      sessionId: authContext.sessionId,
    }, 'User logged out successfully')

    // Client also calls `authClient.signOut()`; keep this endpoint as a server-side audit/log hook.
    return ok({
      success: true,
      message: 'Logged out successfully',
    })
  })
}

