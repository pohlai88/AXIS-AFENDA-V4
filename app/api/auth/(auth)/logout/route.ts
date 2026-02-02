/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/auth/logout
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"
import { db } from '@/lib/server/db'
import { sessions } from '@/lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { getAuthContext } from '@/lib/server/auth/context'
import { logAuthEvent } from '@/lib/server/auth/audit-log'
import { logger } from '@/lib/server/logger'
import { COOKIE_NAMES } from '@/lib/constants'
import { fail, ok } from "@/lib/server/api/response"
import { withApiErrorBoundary } from "@/lib/server/api/handler"

export async function POST(request: NextRequest) {
  return withApiErrorBoundary(request, async () => {
    const authContext = await getAuthContext()

    if (!authContext.isAuthenticated || !authContext.sessionId) {
      return fail({ code: "UNAUTHORIZED", message: "Not authenticated" }, 401)
    }

    // Delete session from database
    await db
      .delete(sessions)
      .where(eq(sessions.sessionToken, authContext.sessionId))

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

    // Clear auth cookies
    const response = ok({
      success: true,
      message: 'Logged out successfully',
    })

    // Clear Neon Auth cookie
    response.cookies.set(COOKIE_NAMES.NEON_AUTH, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  })
}

