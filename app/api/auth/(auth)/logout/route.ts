/**
 * Logout API Endpoint
 * 
 * Handles user logout by invalidating sessions and clearing cookies.
 * Supports session revocation and audit logging.
 * 
 * @route POST /api/auth/logout
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/server/db'
import { sessions } from '@/lib/server/db/schema'
import { eq } from 'drizzle-orm'
import { getAuthContext } from '@/lib/server/auth/context'
import { logAuthEvent } from '@/lib/server/auth/audit-log'
import { logger } from '@/lib/server/logger'
import { COOKIE_NAMES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext()

    if (!authContext.isAuthenticated || !authContext.sessionId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
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
    const response = NextResponse.json({
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
  } catch (error) {
    logger.error({ error }, 'Error during logout')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

