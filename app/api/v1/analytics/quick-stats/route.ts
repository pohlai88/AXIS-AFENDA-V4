import { ok, fail } from "@/lib/server/api/response"
import { AnalyticsService } from "@/lib/server/analytics"
import { logger } from "@/lib/server/logger"

/**
 * GET /api/v1/analytics/quick-stats
 *
 * Returns quick stats for dashboard display.
 */
export async function GET(request: Request) {
  try {
    // Get user ID from headers
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return fail(
        { message: "User ID required", code: "UNAUTHORIZED" },
        401
      )
    }

    const analyticsService = new AnalyticsService()
    const quickStats = await analyticsService.getQuickStats(userId)

    return ok(quickStats)
  } catch (error) {
    logger.error({ error }, "[analytics] Quick stats request failed")
    return fail(
      { message: "Failed to fetch quick stats", code: "INTERNAL_ERROR" },
      500
    )
  }
}
