/**
 * Cron route authorization.
 * Accepts either:
 * - Authorization: Bearer <CRON_SECRET> (how Vercel Cron invokes endpoints)
 * - x-cron-secret: <CRON_SECRET> (for manual or external schedulers)
 */

import { fail } from "@/lib/server/api/response"

export function validateCronSecret(request: Request): Response | null {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return fail(
      { message: "Unauthorized: CRON_SECRET not configured", code: "UNAUTHORIZED" },
      401
    )
  }

  const authHeader = request.headers.get("authorization")
  const bearerMatch = authHeader?.match(/^Bearer\s+(.+)$/i)
  const bearerSecret = bearerMatch?.[1]?.trim()

  const headerSecret = request.headers.get("x-cron-secret")?.trim()

  const provided = bearerSecret ?? headerSecret
  if (provided !== expected) {
    return fail(
      {
        message: "Unauthorized: invalid or missing cron secret (use Authorization: Bearer <CRON_SECRET> or x-cron-secret header)",
        code: "UNAUTHORIZED",
      },
      401
    )
  }

  return null
}
