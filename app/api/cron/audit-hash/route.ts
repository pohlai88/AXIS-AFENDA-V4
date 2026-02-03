/**
 * @domain magicfolder
 * @layer api
 * @responsibility API route handler for /api/cron/audit-hash (Vercel Cron).
 *
 * Aligned with existing cron: same CRON_SECRET auth and GET health pattern as generate-recurrence.
 */

import { ok, fail } from "@/lib/server/api/response"
import { validateCronSecret } from "@/lib/server/api/cron-auth"
import { runHashAudit } from "@/lib/server/magicfolder/hash-audit"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const MAX_SAMPLE = 100
const DEFAULT_SAMPLE = 20

/**
 * POST /api/cron/audit-hash
 *
 * Run hash audit: sample object versions, re-download from R2, verify SHA-256.
 * Called by Vercel Cron or external scheduler.
 * Authorization: CRON_SECRET via Authorization: Bearer (Vercel Cron) or x-cron-secret header.
 */
export async function POST(request: Request) {
  const unauth = validateCronSecret(request)
  if (unauth) return unauth

  const url = new URL(request.url)
  const sampleParam = url.searchParams.get("sample")
  const sampleSize = Math.min(
    Math.max(1, parseInt(sampleParam ?? String(DEFAULT_SAMPLE), 10) || DEFAULT_SAMPLE),
    MAX_SAMPLE
  )

  try {
    const result = await runHashAudit(sampleSize)
    return ok(result)
  } catch (error) {
    return fail(
      { message: "Hash audit failed", code: "AUDIT_ERROR" },
      500
    )
  }
}

/**
 * GET /api/cron/audit-hash — health check
 */
export async function GET() {
  return ok({
    status: "ok",
    endpoint: routes.api.cron.auditHash(),
    method: "POST",
    headers_required: ["Authorization: Bearer <CRON_SECRET> or x-cron-secret"],
    timestamp: new Date().toISOString(),
  })
}
