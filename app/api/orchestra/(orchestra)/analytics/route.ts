import { ok, fail } from "@/lib/server/api/response"
import { parseSearchParams } from "@/lib/server/api/validate"
import { AnalyticsService } from "@/lib/server/analytics"
import { AnalyticsRequestSchema } from "@/lib/contracts/analytics"
import { logger } from "@/lib/server/logger"

/**
 * GET /api/orchestra/analytics
 *
 * Returns comprehensive analytics for the authenticated user.
 * Supports time range filtering and optional pattern/tag analysis.
 */
export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const analyticsRequest = parseSearchParams(searchParams, AnalyticsRequestSchema)

    // Get user ID from headers (following existing pattern)
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return fail(
        { message: "User ID required", code: "UNAUTHORIZED" },
        401
      )
    }

    const analyticsService = new AnalyticsService()

    // Get comprehensive analytics
    const analytics = await analyticsService.getAnalytics(userId, analyticsRequest)

    return ok(analytics)
  } catch (error) {
    logger.error({ error }, "[analytics] GET request failed")

    if (error instanceof Error && error.message.includes("Invalid query params")) {
      return fail(
        { message: "Invalid query parameters", code: "VALIDATION_ERROR" },
        400
      )
    }

    return fail(
      { message: "Failed to fetch analytics", code: "INTERNAL_ERROR" },
      500
    )
  }
}

