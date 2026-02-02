/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/verify-email/resend
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"

import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"
import { fail, ok } from "@/lib/server/api/response"

/**
 * Resend verification email (delegates to Neon Auth).
 *
 * Body:
 * - email: string
 * - callbackURL?: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown
      callbackURL?: unknown
    }
    const email = typeof body.email === "string" ? body.email : ""
    const callbackURL = typeof body.callbackURL === "string" ? body.callbackURL : undefined
    const ipAddress = extractIpAddress(request.headers)

    if (!email) {
      return fail({ code: "BAD_REQUEST", message: "Email is required" }, 400)
    }

    await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.email.resendCode(), request.nextUrl.origin), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ email, ...(callbackURL ? { callbackURL } : {}) }),
      }),
      { params: Promise.resolve({ path: ["email", "resend-code"] }) }
    )

    await logAuthEvent({
      action: "verification_email_resent",
      success: true,
      ipAddress,
      metadata: { email: email.toLowerCase() },
    })

    return ok(
      { success: true, message: "Verification email sent. Please check your inbox." },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Error resending verification email")
    return ok(
      { success: true, message: "Verification email sent. Please check your inbox." },
      { status: 200 }
    )
  }
}

