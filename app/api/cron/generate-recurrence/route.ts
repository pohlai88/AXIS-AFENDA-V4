/**
 * @domain orchestra
 * @layer api
 * @responsibility API route handler for /api/cron/generate-recurrence
 */

import { ok, fail } from "@/lib/server/api/response"
import { validateCronSecret } from "@/lib/server/api/cron-auth"
import { generateNextOccurrences, cleanupOverdueTasks } from "@/lib/server/scheduler/recurrence"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"

// Route Segment Config: Cron jobs should always be dynamic and need extended timeouts
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for background scheduler

/**
 * POST /api/cron/generate-recurrence
 *
 * Trigger background scheduler to generate next task occurrences.
 * Can be called by Vercel Cron, external scheduler, or manual requests.
 *
 * Authorization: CRON_SECRET via Authorization: Bearer (Vercel Cron) or x-cron-secret header.
 */
export async function POST(request: Request) {
  const unauth = validateCronSecret(request)
  if (unauth) return unauth

  try {
    const result = await generateNextOccurrences(100)
    const cleanup = await cleanupOverdueTasks()

    return ok({
      generated: result.generated,
      cleaned: cleanup.cleaned,
      timestamp: result.timestamp,
      message: "Scheduler completed successfully",
    })
  } catch (error) {
    logger.error({ error }, "[cron] generate-recurrence failed")
    return fail(
      { message: "Scheduler failed", code: "SCHEDULER_ERROR" },
      500
    )
  }
}

/**
 * GET /api/cron/generate-recurrence
 *
 * Health check endpoint
 */
export async function GET() {
  return ok({
    status: "ok",
    endpoint: routes.api.cron.generateRecurrence(),
    method: "POST",
    headers_required: ["Authorization: Bearer <CRON_SECRET> or x-cron-secret"],
    timestamp: new Date().toISOString(),
  })
}
