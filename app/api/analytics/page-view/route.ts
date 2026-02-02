/**
 * @domain analytics
 * @layer api
 * @responsibility API route handler for /api/analytics/page-view
 */

import "@/lib/server/only"

import { ok } from "@/lib/server/api/response"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { logger } from "@/lib/server/logger"

/**
 * POST /api/analytics/page-view
 *
 * Receives lightweight page view events from the client.
 * This is intentionally minimal and can be extended to forward to an external provider.
 */
export async function POST(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const body = (await req.json().catch(() => null)) as
      | {
          pageName?: unknown
          timestamp?: unknown
          url?: unknown
          metadata?: unknown
        }
      | null

    logger.info(
      {
        pageName: typeof body?.pageName === "string" ? body.pageName : undefined,
        timestamp: typeof body?.timestamp === "string" ? body.timestamp : undefined,
        url: typeof body?.url === "string" ? body.url : undefined,
        metadata: body?.metadata,
      },
      "[page-view] Event received"
    )

    return ok({ success: true })
  })
}

