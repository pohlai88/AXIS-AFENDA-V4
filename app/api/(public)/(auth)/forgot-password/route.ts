/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/forgot-password
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"

import { auth } from "@/lib/auth/server"
import { extractIpAddress, logAuthEvent } from "@/lib/server/auth/audit-log"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"
import { fail, ok } from "@/lib/server/api/response"

function isSafeRedirectUrl(origin: string, value: unknown): value is string {
  if (typeof value !== "string" || !value) return false

  // Allow internal paths like "/reset-password"
  if (value.startsWith("/") && !value.startsWith("//")) return true

  // Allow absolute URLs only when same-origin
  try {
    const url = new URL(value)
    return url.origin === origin
  } catch {
    return false
  }
}

/**
 * Request password reset email (delegates to Neon Auth).
 *
 * Body:
 * - email: string
 * - redirectTo?: string (optional; same-origin absolute URL or internal path)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      email?: unknown
      redirectTo?: unknown
    }

    const email = typeof body.email === "string" ? body.email : ""
    const ipAddress = extractIpAddress(request.headers)

    if (!email) {
      return fail({ code: "BAD_REQUEST", message: "Email is required" }, 400)
    }

    const origin = request.nextUrl.origin
    const redirectTo = isSafeRedirectUrl(origin, body.redirectTo)
      ? body.redirectTo
      : routes.ui.auth.resetPassword()

    const redirectUrl = redirectTo.startsWith("/")
      ? new URL(redirectTo, origin).toString()
      : redirectTo

    // Delegate to Neon Auth to request password reset
    const neonResponse = await auth.handler().POST(
      new NextRequest(new URL(routes.api.auth.internal.password.reset(), origin), {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...Object.fromEntries(request.headers),
        },
        body: JSON.stringify({ email, redirectUrl }),
      }),
      { params: Promise.resolve({ path: ["password", "reset"] }) }
    )

    if (!neonResponse.ok) {
      const bodyText = await neonResponse.text()
      logger.warn(
        {
          neonStatus: neonResponse.status,
          neonStatusText: neonResponse.statusText,
          neonBody: bodyText.slice(0, 500),
          emailHint: email.slice(0, 3) + "***",
        },
        "Neon Auth password reset returned non-OK – user may not receive email. Check Neon Console → Auth → Email configuration (e.g. Resend/SendGrid)."
      )
    }

    await logAuthEvent({
      action: "password_reset_requested",
      success: neonResponse.ok,
      ipAddress,
      metadata: {
        email: email.toLowerCase(),
        ...(neonResponse.ok ? {} : { neonStatus: neonResponse.status }),
      },
    })

    // Always return success to avoid email enumeration
    return ok(
      {
        success: true,
        message:
          "If that email address is in our system, you will receive a password reset link.",
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Error requesting password reset")
    return ok(
      {
        success: true,
        message:
          "If that email address is in our system, you will receive a password reset link.",
      },
      { status: 200 }
    )
  }
}

