/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/auth/refresh
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"
import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { routes } from "@/lib/routes"
import { fail, ok } from "@/lib/server/api/response"
import { withApiErrorBoundary } from "@/lib/server/api/handler"

/**
 * POST /api/auth/refresh
 * 
 * Refreshes the user's authentication session with Neon Auth.
 * Neon Auth SDK handles token rotation and expiry management automatically.
 * 
 * @route POST /api/auth/refresh
 */

export async function POST(request: NextRequest) {
  return withApiErrorBoundary(request, async (log, requestId) => {
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
      log.info({ ipAddress, requestId }, "Session refreshed successfully")
      return ok({ refreshed: true }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store', // Never cache token refresh responses
        },
      })
    } else {
      await logAuthEvent({
        action: "token_refresh",
        success: false,
        ipAddress,
        errorMessage: "Session refresh failed",
      })
      log.warn({ ipAddress, requestId }, "Session refresh failed")
      return fail(
        { code: "UNAUTHORIZED", message: "Session refresh failed" },
        401
      )
    }
  })
}

