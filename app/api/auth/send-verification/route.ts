import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { logAuthEvent } from "@/lib/server/auth/audit-log"
import { extractIpAddress } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"

/**
 * Send Email Verification Endpoint
 * 
 * Sends an initial email verification link to a user.
 * Used during sign-up or when requesting manual email verification.
 * 
 * @route POST /api/auth/send-verification
 * 
 * Body:
 * {
 *   "email": "user@example.com"
 * }
 * 
 * Rate-limited: 1 per email per hour
 * 
 * Delegates to Neon Auth for code generation and sending,
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Delegate to Neon Auth to send verification email
    const response = await auth.handler().POST(
      new NextRequest(new URL(`${request.nextUrl.origin}/api/auth/email/send-code`), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ email }),
      }),
      { params: Promise.resolve({ path: ["email", "send-code"] }) }
    )

    if (response.ok) {
      // Log successful email send
      await logAuthEvent({
        action: "verification_email_sent",
        success: true,
        ipAddress,
        metadata: {
          email: email.toLowerCase(),
        },
      })

      logger.info({ email, ipAddress }, "Verification email sent")
    } else {
      logger.warn({ email, ipAddress }, "Failed to send verification email")
    }

    // Always return success to avoid email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent. Please check your inbox.",
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Error sending verification email")

    // Always return success to avoid email enumeration
    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent. Please check your inbox.",
      },
      { status: 200 }
    )
  }
}
