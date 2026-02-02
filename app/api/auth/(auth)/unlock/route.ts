/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/auth/unlock
 */

import "@/lib/server/only"

import { NextRequest, NextResponse } from "next/server"
import { verifyUnlockToken } from "@/lib/server/auth/unlock"
import { resetLoginAttempts } from "@/lib/server/auth/rate-limit"
import { logAuthEvent } from "@/lib/server/auth/audit-log"
import { fail, ok } from "@/lib/server/api/response"
import { withApiErrorBoundary } from "@/lib/server/api/handler"

function getParam(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key)
  return value ? value : undefined
}

async function handleUnlock(email?: string, token?: string) {
  if (!email || !token) {
    return fail({ code: "BAD_REQUEST", message: "Missing email or token" }, 400)
  }

  const valid = await verifyUnlockToken(email, token)
  if (!valid) {
    return fail({ code: "INVALID_TOKEN", message: "Invalid or expired token" }, 400)
  }

  await resetLoginAttempts({ email })

  await logAuthEvent({
    userId: undefined,
    action: "account_unlocked",
    success: true,
    metadata: { email },
  })

  return ok({ success: true }, { status: 200 })
}

export async function GET(request: NextRequest) {
  return withApiErrorBoundary(request, async () => {
    const email = getParam(request, "email")
    const token = getParam(request, "token")

    const response = await handleUnlock(email, token)

    if (response.ok) {
      return NextResponse.redirect(new URL("/login?unlocked=1", request.url))
    }

    return response
  })
}

export async function POST(request: NextRequest) {
  return withApiErrorBoundary(request, async () => {
    const body = (await request.json().catch(() => ({}))) as { email?: string; token?: string }
    return handleUnlock(body.email, body.token)
  })
}

