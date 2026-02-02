/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/admin/unlock-account
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"
import { getAuthContext } from "@/lib/server/auth/context"
import { resetLoginAttempts } from "@/lib/server/auth/rate-limit"
import { logAuthEvent } from "@/lib/server/auth/audit-log"
import { fail, ok } from "@/lib/server/api/response"

export async function POST(request: NextRequest) {
  const auth = await getAuthContext()

  if (!auth.isAuthenticated || !auth.userId) {
    return fail({ code: "UNAUTHORIZED", message: "Authentication required" }, 401)
  }

  if (!auth.roles.includes("admin")) {
    return fail({ code: "FORBIDDEN", message: "Admin access required" }, 403)
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string }

  if (!body.email) {
    return fail({ code: "BAD_REQUEST", message: "Email is required" }, 400)
  }

  await resetLoginAttempts({ email: body.email })

  await logAuthEvent({
    userId: auth.userId,
    action: "account_unlocked",
    success: true,
    metadata: { email: body.email, actor: auth.userId, source: "admin" },
  })

  return ok({ success: true }, { status: 200 })
}

