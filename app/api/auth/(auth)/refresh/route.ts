import "@/lib/server/only"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"

/**
 * POST /api/auth/refresh
 * 
 * Refreshes the user's authentication session with Neon Auth.
 * Neon Auth SDK handles token rotation and expiry management automatically.
 * 
 * @route POST /api/auth/refresh
 */

export async function POST(request: NextRequest) {
  try {
    const ipAddress = extractIpAddress(request.headers)

    // Delegate to Neon Auth for session refresh
    // The auth.handler() manages token rotation, expiry validation,
    // and cookie management automatically
    const response = await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.refreshSession(), request.nextUrl.origin), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
      }),
      { params: Promise.resolve({ path: ["refresh-session"] }) }
    )

    if (response.ok) {
      await logAuthEvent({
        action: "token_refresh",
        success: true,
        ipAddress,
      })
      logger.info({ ipAddress }, "Session refreshed successfully")
    } else {
      await logAuthEvent({
        action: "token_refresh",
        success: false,
        ipAddress,
        errorMessage: "Session refresh failed",
      })
      logger.warn({ ipAddress }, "Session refresh failed")
    }

    return response
  } catch (error) {
    logger.error({ error }, "Error refreshing session")
    return NextResponse.json(
      { error: "Failed to refresh session" },
      { status: 500 }
    )
  }
}

