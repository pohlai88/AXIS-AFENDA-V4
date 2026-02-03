/**
 * @domain magicfolder
 * @layer api
 * @responsibility Process one job from the MagicFolder BullMQ queue (for Vercel Cron when REDIS_URL is set).
 *
 * Aligned with existing cron: x-cron-secret auth, GET health. No-op when REDIS_URL is not set.
 */

import { ok, fail } from "@/lib/server/api/response"
import { validateCronSecret } from "@/lib/server/api/cron-auth"
import { processOneMagicfolderJobFromQueue } from "@/lib/server/magicfolder/jobs"
import { routes } from "@/lib/routes"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * POST /api/cron/process-magicfolder-queue
 *
 * Process one job from the magicfolder BullMQ queue. Use with Vercel Cron when using Redis.
 * Authorization: CRON_SECRET via Authorization: Bearer (Vercel Cron) or x-cron-secret header.
 */
export async function POST(request: Request) {
  const unauth = validateCronSecret(request)
  if (unauth) return unauth

  try {
    const result = await processOneMagicfolderJobFromQueue(55_000)
    return ok(result)
  } catch (error) {
    return fail(
      { message: "Process queue failed", code: "QUEUE_ERROR" },
      500
    )
  }
}

/**
 * GET /api/cron/process-magicfolder-queue — health check
 */
export async function GET() {
  return ok({
    status: "ok",
    endpoint: routes.api.cron.processMagicfolderQueue(),
    method: "POST",
    headers_required: ["Authorization: Bearer <CRON_SECRET> or x-cron-secret"],
    timestamp: new Date().toISOString(),
  })
}
