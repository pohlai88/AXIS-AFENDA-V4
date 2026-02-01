import "@/lib/server/only"

import { NextRequest, NextResponse } from "next/server"
import { getAuthContext } from "@/lib/server/auth/context"
import { resetLoginAttempts } from "@/lib/server/auth/rate-limit"
import { logAuthEvent } from "@/lib/server/auth/audit-log"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext()

  if (!auth.isAuthenticated || !auth.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  if (!auth.roles.includes("admin")) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string }

  if (!body.email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  await resetLoginAttempts({ email: body.email })

  await logAuthEvent({
    userId: auth.userId,
    action: "account_unlocked",
    success: true,
    metadata: { email: body.email, actor: auth.userId, source: "admin" },
  })

  return NextResponse.json({ success: true })
}
