/**
 * @layer api
 * @responsibility Health check for DB + RLS setup
 */

import "@/lib/server/only"

import { ok, fail } from "@/lib/server/api/response"
import { checkDbHealth, checkRlsHealth } from "@/lib/server/db/client"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const secret = process.env.DB_HEALTH_SECRET
  if (secret) {
    const provided = request.headers.get("x-health-secret")
    if (provided !== secret) {
      return fail({ code: "UNAUTHORIZED", message: "Unauthorized" }, 401)
    }
  }

  const [db, rls] = await Promise.all([checkDbHealth(), checkRlsHealth()])

  if (!db.ok) {
    return fail({ code: "DB_UNHEALTHY", message: db.error.message }, 500)
  }
  if (!rls.ok) {
    return fail({ code: "RLS_CHECK_FAILED", message: rls.error.message }, 500)
  }
  if (rls.value.missingRlsOnTables.length > 0) {
    return fail(
      { code: "RLS_MISCONFIGURED", message: `Missing RLS on: ${rls.value.missingRlsOnTables.join(", ")}` },
      500
    )
  }

  return ok({
    db: { ok: db.value },
    rls: rls.value,
    timestamp: new Date().toISOString(),
  })
}

