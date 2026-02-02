/**
 * @domain analytics
 * @layer api
 * @responsibility API route handler for /api/analytics/web-vitals
 */

import "@/lib/server/only"
import { ok } from "@/lib/server/api/response"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { logger } from "@/lib/server/logger"

/**
 * POST /api/analytics/web-vitals
 *
 * Receives Web Vitals performance metrics from the client.
 * Logs metrics for monitoring and can be extended to send to external analytics services.
 */
export async function POST(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const body = await req.json()

    const { name, value, rating, id, navigationType } = body

    // Log metrics for monitoring
    logger.info(
      {
        metric: name,
        value,
        rating,
        id,
        navigationType,
      },
      "[web-vitals] Metric received"
    )

    // TODO: Send to external analytics service (e.g., Vercel Analytics, Google Analytics)
    // Example:
    // await sendToAnalytics({ name, value, rating, id, navigationType })

    return ok({ success: true })
  })
}
