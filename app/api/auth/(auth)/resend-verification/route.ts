import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { logAuthEvent } from "@/lib/server/auth/audit-log"
import { extractIpAddress } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"

/**
 * Resend Email Verification Endpoint
 * 
 * Allows users to request a new verification email if the original expired.
 * 
 * @route POST /api/auth/resend-verification
 * 
 * Rate-limited: 1 per email per hour
 * 
 * Delegates to Neon Auth for email resending,
 * then logs audit event.
 */

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

    // Delegate to Neon Auth for resending verification email
    const response = await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.email.resendCode(), request.nextUrl.origin), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ email }),
      }),
      { params: Promise.resolve({ path: ["email", "resend-code"] }) }
    )

    if (response.ok) {
      // Log successful resend
      await logAuthEvent({
        action: "verification_email_resent",
        success: true,
        ipAddress,
        metadata: {
          email: email.toLowerCase(),
        },
      })

      logger.info({ email, ipAddress }, "Verification email resent")

      // Return success but don't leak email existence
      return NextResponse.json(
        {
          success: true,
          message: "Verification email sent. Please check your inbox.",
        },
        { status: 200 }
      )
    } else {
      logger.warn({ email, ipAddress }, "Failed to resend verification email")

      // Return generic error to avoid email enumeration
      return NextResponse.json(
        {
          success: true,
          message: "Verification email sent. Please check your inbox.",
        },
        { status: 200 }
      )
    }
  } catch (error) {
    logger.error({ error }, "Error resending verification email")

    // Return generic error
    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent. Please check your inbox.",
      },
      { status: 200 }
    )
  }
}

