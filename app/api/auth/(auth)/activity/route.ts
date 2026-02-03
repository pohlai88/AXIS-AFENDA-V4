/**
 * @domain auth
 * @layer api
 * @responsibility GET /api/auth/activity – activity/audit for current user
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"
import { desc, eq } from "drizzle-orm"
import { getAuthContext } from "@/lib/server/auth/context"
import { userActivityLog } from "@/lib/server/db/schema"
import { withRlsDb } from "@/lib/server/db/rls"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { ok, fail } from "@/lib/server/api/response"
import { activityListResponseSchema, type ActivityEvent } from "@/lib/contracts/auth"

/**
 * GET /api/auth/activity
 *
 * Returns activity/audit events for the authenticated user from neon_user_activity_log.
 */
export async function GET(request: NextRequest) {
  return withApiErrorBoundary(request, async (log, requestId) => {
    const authContext = await getAuthContext()

    if (!authContext.isAuthenticated || !authContext.userId) {
      return fail(
        { code: "UNAUTHORIZED", message: "User not authenticated" },
        401
      )
    }

    const userId = authContext.userId
    const rows = await withRlsDb(userId, async (db) =>
      db
        .select()
        .from(userActivityLog)
        .where(eq(userActivityLog.userId, userId))
        .orderBy(desc(userActivityLog.createdAt))
        .limit(50)
    )

    const events: ActivityEvent[] = rows.map((row) => ({
      id: row.id,
      action: row.action,
      resource: row.resource ?? null,
      resourceId: row.resourceId ?? null,
      ipAddress: row.ipAddress ?? null,
      userAgent: row.userAgent ?? null,
      metadata:
        row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : undefined,
      createdAt: row.createdAt.toISOString(),
    }))

    const response = activityListResponseSchema.parse({ events, total: events.length })

    log.info(
      { userId, requestId, eventCount: events.length },
      "Activity list retrieved"
    )

    return ok(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, max-age=60",
      },
    })
  })
}
