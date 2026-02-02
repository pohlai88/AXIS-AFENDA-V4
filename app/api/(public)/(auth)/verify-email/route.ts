/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/verify-email
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"

import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"
import { fail, ok } from "@/lib/server/api/response"

/**
 * Verify email code (delegates to Neon Auth).
 *
 * - GET /api/verify-email?code=...
 * - POST /api/verify-email { code }
 */
export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
    const ipAddress = extractIpAddress(request.headers)

    if (!code) {
      return fail({ code: "BAD_REQUEST", message: "Verification code is required" }, 400)
    }

    const response = await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.email.verify(), request.nextUrl.origin), {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify({ code }),
      }),
      { params: Promise.resolve({ path: ["email", "verify"] }) }
    )

    if (response.ok) {
      await logAuthEvent({ action: "email_verified", success: true, ipAddress })
      logger.info({ ipAddress }, "Email verified successfully")
      return ok({ success: true }, { status: 200 })
    } else {
      logger.warn({ ipAddress }, "Email verification failed")
      return fail({ code: "INVALID_CODE", message: "Email verification failed" }, 400)
    }
  } catch (error) {
    logger.error({ error }, "Error verifying email")
    return fail({ code: "INTERNAL", message: "Failed to verify email" }, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as { code?: unknown }
    const code = typeof body.code === "string" ? body.code : ""
    const ipAddress = extractIpAddress(request.headers)

    if (!code) {
      return fail({ code: "BAD_REQUEST", message: "Verification code is required" }, 400)
    }

    const response = await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.email.verify(), request.nextUrl.origin), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ code }),
      }),
      { params: Promise.resolve({ path: ["email", "verify"] }) }
    )

    if (response.ok) {
      await logAuthEvent({ action: "email_verified", success: true, ipAddress })
      logger.info({ ipAddress }, "Email verified successfully")
      return ok({ success: true }, { status: 200 })
    } else {
      logger.warn({ ipAddress }, "Email verification failed")
      return fail({ code: "INVALID_CODE", message: "Email verification failed" }, 400)
    }
  } catch (error) {
    logger.error({ error }, "Error verifying email")
    return fail({ code: "INTERNAL", message: "Failed to verify email" }, 500)
  }
}

