/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/reset-password
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"

import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"
import { fail, ok } from "@/lib/server/api/response"

/**
 * GET /api/reset-password?token=...  -> verify token (optional helper)
 * POST /api/reset-password          -> set new password
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    const ipAddress = extractIpAddress(request.headers)

    if (!token) {
      return fail({ code: "BAD_REQUEST", message: "Reset token is required" }, 400)
    }

    const response = await auth.handler().POST(
      new NextRequest(
        new URL(routes.api.auth.internal.password.verifyResetToken(), request.nextUrl.origin),
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...Object.fromEntries(request.headers),
          },
          body: JSON.stringify({ token }),
        }
      ),
      { params: Promise.resolve({ path: ["password", "verify-reset-token"] }) }
    )

    if (!response.ok) {
      return fail({ code: "INVALID_TOKEN", message: "Invalid or expired reset token" }, 400)
    }

    logger.info({ ipAddress }, "Password reset token verified")
    return ok({ valid: true }, { status: 200 })
  } catch (error) {
    logger.error({ error }, "Error verifying reset token")
    return fail({ code: "INTERNAL", message: "Failed to verify reset token" }, 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      token?: unknown
      password?: unknown
    }
    const token = typeof body.token === "string" ? body.token : ""
    const password = typeof body.password === "string" ? body.password : ""
    const ipAddress = extractIpAddress(request.headers)

    if (!token) {
      return fail({ code: "BAD_REQUEST", message: "Reset token is required" }, 400)
    }
    if (!password || password.length < 8) {
      return fail({ code: "BAD_REQUEST", message: "Password must be at least 8 characters" }, 400)
    }

    const response = await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.password.resetPassword(), request.nextUrl.origin), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ token, newPassword: password }),
      }),
      { params: Promise.resolve({ path: ["password", "reset-password"] }) }
    )

    if (!response.ok) {
      logger.warn({ ipAddress }, "Password reset failed")
      return fail(
        {
          code: "RESET_FAILED",
          message: "Failed to reset password. Please try again or request a new reset link.",
        },
        400
      )
    }

    await logAuthEvent({
      action: "password_reset_completed",
      success: true,
      ipAddress,
    })

    return ok(
      {
        success: true,
        message: "Password reset successfully. You can now sign in with your new password.",
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Error resetting password")
    return fail({ code: "INTERNAL", message: "Failed to reset password" }, 500)
  }
}

