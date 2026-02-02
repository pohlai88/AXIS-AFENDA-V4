import "@/lib/server/only"

import { cache } from "react"
import { logger } from "@/lib/server/logger"
import { listNeonSessions, revokeNeonSession, revokeOtherNeonSessions } from "@/lib/server/auth/neon-sessions"

export interface SessionInfo {
  id: string
  /**
   * Legacy field from pre-Neon-Auth session storage.
   * Neon Auth session tokens must never be returned to clients.
   */
  sessionToken: string
  device: string
  browser: string
  os: string
  ipAddress: string | null
  lastActive: Date
  expires: Date
  createdAt: Date
  isCurrent: boolean
}

/**
 * @deprecated This module previously queried local `sessions` table.
 * Neon Auth now owns session storage; use `lib/server/auth/neon-sessions.ts`.
 */
export function parseUserAgent(userAgent: string | null): {
  device: string
  browser: string
  os: string
} {
  if (!userAgent) {
    return {
      device: "Unknown Device",
      browser: "Unknown Browser",
      os: "Unknown OS",
    }
  }

  // Detect OS
  let os = "Unknown OS"
  if (/Windows NT 10/.test(userAgent)) os = "Windows 10/11"
  else if (/Windows NT/.test(userAgent)) os = "Windows"
  else if (/Mac OS X/.test(userAgent)) os = "macOS"
  else if (/Linux/.test(userAgent)) os = "Linux"
  else if (/Android/.test(userAgent)) os = "Android"
  else if (/iPhone|iPad|iPod/.test(userAgent)) os = "iOS"

  // Detect browser
  let browser = "Unknown Browser"
  if (/Edg\//.test(userAgent)) browser = "Edge"
  else if (/Chrome\//.test(userAgent) && !/Edg\//.test(userAgent)) browser = "Chrome"
  else if (/Firefox\//.test(userAgent)) browser = "Firefox"
  else if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) browser = "Safari"
  else if (/OPR\/|Opera\//.test(userAgent)) browser = "Opera"

  // Detect device type
  let device = "Desktop"
  if (/Mobile|Android|iPhone|iPod/.test(userAgent)) device = "Mobile"
  else if (/Tablet|iPad/.test(userAgent)) device = "Tablet"

  return { device, browser, os }
}

/**
 * Get all active sessions for a user
 * 
 * Memoized with React cache to prevent duplicate queries
 * during the same render pass (e.g., if called multiple times)
 */
export const getUserActiveSessions = cache(async function getUserActiveSessions(
  userId: string,
  currentSessionToken?: string
): Promise<SessionInfo[]> {
  try {
    void userId
    void currentSessionToken
    const { sessions } = await listNeonSessions()
    return sessions.map((s) => ({
      id: s.id,
      sessionToken: "", // never expose Neon Auth session token
      device: s.device,
      browser: s.browser,
      os: s.os,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      expires: s.expires,
      createdAt: s.createdAt,
      isCurrent: s.isCurrent,
    }))
  } catch (error) {
    logger.error({ error, userId }, "Failed to get user active sessions")
    return []
  }
})

/**
 * Revoke a specific session by ID
 * Returns true if session was deleted, false if not found or not owned by user
 */
export async function revokeSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    void userId
    await revokeNeonSession(sessionId)
    logger.info({ sessionId }, "Neon session revoked successfully")
    return true
  } catch (error) {
    logger.error({ error, sessionId, userId }, "Failed to revoke session")
    return false
  }
}

/**
 * Revoke all sessions for a user except the current one
 */
export async function revokeAllOtherSessions(
  userId: string,
  currentSessionToken: string
): Promise<number> {
  try {
    void userId
    void currentSessionToken
    await revokeOtherNeonSessions()
    // Neon does not report count reliably via SDK; callers should refresh list.
    return 0
  } catch (error) {
    logger.error({ error, userId }, "Failed to revoke other sessions")
    return 0
  }
}

/**
 * Clean up expired sessions (maintenance function)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  // Neon Auth owns session expiry; no-op.
  return 0
}
