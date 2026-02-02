import "@/lib/server/only"

import { cache } from "react"
import { eq, and, gt, lt, not, desc } from "drizzle-orm"

import { db } from "@/lib/server/db"
import { sessions } from "@/lib/server/db/schema"
import { logger } from "@/lib/server/logger"

export interface SessionInfo {
  id: string
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
 * Parse User-Agent string to extract device, browser, and OS information
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
    const now = new Date()

    // Query all non-expired sessions for the user
    const userSessions = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), gt(sessions.expires, now)))
      .orderBy(desc(sessions.updatedAt))

    // Map to SessionInfo
    const sessionInfos: SessionInfo[] = userSessions.map((session) => {
      const { device, browser, os } = parseUserAgent(session.userAgent)

      return {
        id: session.id,
        sessionToken: session.sessionToken,
        device,
        browser,
        os,
        ipAddress: session.ipAddress,
        lastActive: session.updatedAt,
        expires: session.expires,
        createdAt: session.createdAt,
        isCurrent: currentSessionToken ? session.sessionToken === currentSessionToken : false,
      }
    })

    return sessionInfos
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
    const result = await db
      .delete(sessions)
      .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
      .returning({ id: sessions.id })

    if (result.length === 0) {
      logger.warn({ sessionId, userId }, "Session not found or not owned by user")
      return false
    }

    logger.info({ sessionId, userId }, "Session revoked successfully")
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
    const result = await db
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          gt(sessions.expires, new Date()),
          not(eq(sessions.sessionToken, currentSessionToken))
        )
      )
      .returning({ id: sessions.id })

    const deletedCount = result.length

    logger.info({ userId, deletedCount }, "Revoked other user sessions")
    return deletedCount
  } catch (error) {
    logger.error({ error, userId }, "Failed to revoke other sessions")
    return 0
  }
}

/**
 * Clean up expired sessions (maintenance function)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date()
    const result = await db
      .delete(sessions)
      .where(lt(sessions.expires, now))
      .returning({ id: sessions.id })

    const count = result.length
    logger.info({ count }, "Cleaned up expired sessions")
    return count
  } catch (error) {
    logger.error({ error }, "Failed to cleanup expired sessions")
    return 0
  }
}
