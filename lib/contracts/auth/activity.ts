/**
 * @domain auth
 * @layer contracts
 * @responsibility Schemas for auth activity/audit API (GET /api/auth/activity)
 */

import { z } from "zod"

/**
 * Single activity/audit event (matches neon_user_activity_log shape)
 */
export const activityEventSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  resource: z.string().nullable().optional(),
  resourceId: z.string().nullable().optional(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
})

/**
 * GET /api/auth/activity response (events from neon_user_activity_log)
 */
export const activityListResponseSchema = z.object({
  events: z.array(activityEventSchema),
  total: z.number(),
})

export type ActivityEvent = z.infer<typeof activityEventSchema>
export type ActivityListResponse = z.infer<typeof activityListResponseSchema>
