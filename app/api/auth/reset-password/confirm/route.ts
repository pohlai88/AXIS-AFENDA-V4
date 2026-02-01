import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { logAuthEvent } from "@/lib/server/auth/audit-log"
import { extractIpAddress } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"

/**
 * Set New Password After Reset Endpoint
 * 
 * Called after user verifies their reset token.
 * Sets the new password in Neon Auth.
 * 
 * @route POST /api/auth/reset-password/confirm
 * 
 * Body:
 * {
 *   "token": "reset_token_from_email",
 *   "password": "new_secure_password"
 * }
 * 
 * Delegates to Neon Auth for password update,
 * then logs audit event.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body
    const ipAddress = extractIpAddress(request.headers)

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      )
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Delegate to Neon Auth to reset the password
    const response = await auth.handler().POST(
      new NextRequest(new URL(`${request.nextUrl.origin}/api/auth/password/reset-password`), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ token, newPassword: password }),
      }),
      { params: Promise.resolve({ path: ["password", "reset-password"] }) }
    )

    if (response.ok) {
      // Log successful password reset
      await logAuthEvent({
        action: "password_reset_completed",
        success: true,
        ipAddress,
      })

      logger.info({ ipAddress }, "Password reset completed successfully")

      return NextResponse.json(
        {
          success: true,
          message: "Password reset successfully. You can now sign in with your new password.",
        },
        { status: 200 }
      )
    } else {
      logger.warn({ ipAddress }, "Password reset failed")

      return NextResponse.json(
        { error: "Failed to reset password. Please try again or request a new reset link." },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error({ error }, "Error resetting password")
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
