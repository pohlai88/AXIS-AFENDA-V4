import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/server"
import { getServerEnv } from "@/lib/env/server"
import { logAuthEvent } from "@/lib/server/auth/audit-log"
import { extractIpAddress } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"

/**
 * Email Verification Endpoint
 * 
 * Handles email verification for newly created accounts.
 * 
 * @route POST /api/auth/verify-email
 * @route GET /api/auth/verify-email?code=...
 * 
 * Delegates to Neon Auth for token verification,
 * then logs audit event.
 */

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code")
    const ipAddress = extractIpAddress(request.headers)

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      )
    }

    // Delegate to Neon Auth for verification
    const response = await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.email.verify(), request.nextUrl.origin), {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify({ code }),
      }),
      { params: Promise.resolve({ path: ["email", "verify"] }) }
    )

    if (response.ok) {
      // Log successful verification
      await logAuthEvent({
        action: "email_verified",
        success: true,
        ipAddress,
      })

      logger.info({ ipAddress }, "Email verified successfully")
    } else {
      logger.warn({ ipAddress, code }, "Email verification failed")
    }

    return response
  } catch (error) {
    logger.error({ error }, "Error verifying email")
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body
    const ipAddress = extractIpAddress(request.headers)

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      )
    }

    // Delegate to Neon Auth for verification
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
      // Log successful verification
      await logAuthEvent({
        action: "email_verified",
        success: true,
        ipAddress,
      })

      logger.info({ ipAddress }, "Email verified successfully")
    } else {
      logger.warn({ ipAddress }, "Email verification failed")
    }

    return response
  } catch (error) {
    logger.error({ error }, "Error verifying email")
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    )
  }
}

