import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { logAuthEvent } from "@/lib/server/auth/audit-log"
import { extractIpAddress } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"

/**
 * Reset Password Endpoint
 * 
 * Handles the password reset flow:
 * 1. Request reset: POST with email
 * 2. Verify token: GET with token
 * 3. Confirm reset: POST with token and new password
 * 
 * @route POST /api/auth/reset-password (request)
 * @route GET /api/auth/reset-password?token=... (verify token)
 * @route POST /api/auth/reset-password/confirm (set new password)
 * 
 * Rate-limited: 1 reset email per email per hour
 * Token expiry: 1 hour
 * 
 * Delegates to Neon Auth for token management,
 * then logs audit events.
 */

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")
    const ipAddress = extractIpAddress(request.headers)

    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      )
    }

    // Delegate to Neon Auth to verify the reset token
    const response = await auth.handler().POST(
      new NextRequest(new URL(`${request.nextUrl.origin}/api/auth/password/verify-reset-token`), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ token }),
      }),
      { params: Promise.resolve({ path: ["password", "verify-reset-token"] }) }
    )

    if (response.ok) {
      logger.info({ ipAddress }, "Password reset token verified")
      return response
    } else {
      logger.warn({ ipAddress, token }, "Invalid or expired reset token")
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error({ error }, "Error verifying reset token")
    return NextResponse.json(
      { error: "Failed to verify reset token" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body
    const ipAddress = extractIpAddress(request.headers)

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Delegate to Neon Auth to request password reset
    const response = await auth.handler().POST(
      new NextRequest(new URL(`${request.nextUrl.origin}/api/auth/password/reset`), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ email }),
      }),
      { params: Promise.resolve({ path: ["password", "reset"] }) }
    )

    if (response.ok) {
      // Log successful password reset request
      await logAuthEvent({
        action: "password_reset_requested",
        success: true,
        ipAddress,
        metadata: {
          email: email.toLowerCase(),
        },
      })

      logger.info({ email, ipAddress }, "Password reset email sent")
    } else {
      logger.warn({ email, ipAddress }, "Failed to send password reset email")
    }

    // Always return success to avoid email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "If that email address is in our system, you will receive a password reset link.",
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Error requesting password reset")

    // Always return success to avoid email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "If that email address is in our system, you will receive a password reset link.",
      },
      { status: 200 }
    )
  }
}
