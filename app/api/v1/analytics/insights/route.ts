import { ok, fail } from "@/lib/server/api/response"
import { AnalyticsService } from "@/lib/server/analytics"
import { logger } from "@/lib/server/logger"

/**
 * GET /api/v1/analytics/insights
 *
 * Returns AI-powered insights and recommendations.
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
    const insights = await analyticsService.getInsights(userId)

    return ok(insights)
  } catch (error) {
    logger.error({ error }, "[analytics] Insights request failed")
    return fail(
      { message: "Failed to fetch insights", code: "INTERNAL_ERROR" },
      500
    )
  }
}
