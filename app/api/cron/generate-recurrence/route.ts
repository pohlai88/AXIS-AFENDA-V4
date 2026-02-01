import { ok, fail } from "@/lib/server/api/response"
import { generateNextOccurrences, cleanupOverdueTasks } from "@/lib/server/scheduler/recurrence"
import { logger } from "@/lib/server/logger"
import { routes } from "@/lib/routes"

/**
 * POST /api/cron/generate-recurrence
 *
 * Trigger background scheduler to generate next task occurrences.
 * Can be called by Vercel Cron, external scheduler, or manual requests.
 *
 * Authorization: Uses CRON_SECRET header to prevent unauthorized calls.
 */
export async function POST(request: Request) {
  // Validate cron secret (required for security)
  const secret = request.headers.get("x-cron-secret")
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret || secret !== expectedSecret) {
    return fail(
      { message: "Unauthorized: invalid or missing x-cron-secret header", code: "UNAUTHORIZED" },
      401
    )
  }

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
    headers_required: ["x-cron-secret"],
    timestamp: new Date().toISOString(),
  })
}
