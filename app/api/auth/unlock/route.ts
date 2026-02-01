import "@/lib/server/only"

import { NextRequest, NextResponse } from "next/server"
import { verifyUnlockToken } from "@/lib/server/auth/unlock"
import { resetLoginAttempts } from "@/lib/server/auth/rate-limit"
import { logAuthEvent } from "@/lib/server/auth/audit-log"

function getParam(request: NextRequest, key: string): string | undefined {
  const value = request.nextUrl.searchParams.get(key)
  return value ? value : undefined
}

async function handleUnlock(email?: string, token?: string) {
  if (!email || !token) {
    return NextResponse.json({ error: "Missing email or token" }, { status: 400 })
  }

  const valid = await verifyUnlockToken(email, token)
  if (!valid) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
  }

  await resetLoginAttempts({ email })

  await logAuthEvent({
    userId: undefined,
    action: "account_unlocked",
    success: true,
    metadata: { email },
  })

  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const email = getParam(request, "email")
  const token = getParam(request, "token")

  const response = await handleUnlock(email, token)

  if (response.ok) {
    return NextResponse.redirect(new URL("/login?unlocked=1", request.url))
  }

  return response
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { email?: string; token?: string }
  return handleUnlock(body.email, body.token)
}
