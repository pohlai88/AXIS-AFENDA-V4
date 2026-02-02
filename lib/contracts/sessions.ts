import { z } from "zod"

/**
 * Session schemas for API validation
 */

export const sessionResponseSchema = z.object({
  id: z.string().uuid(),
  device: z.string(),
  browser: z.string(),
  os: z.string(),
  ipAddress: z.string().nullable(),
  lastActive: z.string(), // ISO date string
  expires: z.string(), // ISO date string
  createdAt: z.string(), // ISO date string
  isCurrent: z.boolean(),
})

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionResponseSchema),
  total: z.number(),
})

export const sessionIdParamSchema = z.object({
  id: z.string().uuid("Invalid session ID"),
})

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
})

export const revokeSessionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
})

export const revokeAllSessionsResponseSchema = z.object({
  success: z.boolean(),
  revokedCount: z.number(),
  message: z.string(),
})

// Type exports
export type SessionResponse = z.infer<typeof sessionResponseSchema>
export type SessionListResponse = z.infer<typeof sessionListResponseSchema>
export type SessionIdParam = z.infer<typeof sessionIdParamSchema>
export type UserIdParam = z.infer<typeof userIdParamSchema>
export type RevokeSessionResponse = z.infer<typeof revokeSessionResponseSchema>
export type RevokeAllSessionsResponse = z.infer<typeof revokeAllSessionsResponseSchema>
