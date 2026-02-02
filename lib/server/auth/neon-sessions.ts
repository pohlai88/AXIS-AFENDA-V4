/**
 * @domain auth
 * @layer server
 * @responsibility Translate Neon Auth session APIs to app session models.
 * @dependencies
 * - auth (Neon Auth server SDK)
 * - shared logger
 * @exports
 * - listNeonSessions()
 * - revokeNeonSession()
 * - revokeOtherNeonSessions()
 */

import "@/lib/server/only"

import { auth } from "@/lib/auth/server"

export interface NeonSessionInfo {
  id: string
  /**
   * Neon Auth may require the session token to revoke a session.
   * This must never be returned to clients.
   */
  token?: string
  device: string
  browser: string
  os: string
  ipAddress: string | null
  lastActive: Date
  expires: Date
  createdAt: Date
  isCurrent: boolean
}

function parseUserAgent(userAgent: string | null | undefined): {
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

function toDate(value: unknown, fallback: Date = new Date()): Date {
  if (value instanceof Date) return value
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return fallback
}

export async function listNeonSessions(): Promise<{ currentSessionId?: string; sessions: NeonSessionInfo[] }> {
  const sessionRes = (await auth.getSession()) as { data?: unknown; error?: { message?: string } | null }
  const sessionData = sessionRes?.data

  const currentSessionId = (() => {
    if (!sessionData || typeof sessionData !== "object") return undefined
    const sd = sessionData as Record<string, unknown>
    const session = sd["session"]
    if (!session || typeof session !== "object") return undefined
    const s = session as Record<string, unknown>
    const id = s["id"]
    if (typeof id === "string" && id) return id
    const sessionId = s["sessionId"]
    if (typeof sessionId === "string" && sessionId) return sessionId
    const token = s["token"]
    if (typeof token === "string" && token) return token
    return undefined
  })()

  const listRes = (await auth.listSessions()) as { data?: unknown; error?: { message?: string } | null }
  if (listRes?.error) {
    throw new Error(listRes.error.message ?? "Failed to list sessions")
  }

  const listData = listRes?.data
  const rawSessions: unknown = (() => {
    if (Array.isArray(listData)) return listData
    if (!listData || typeof listData !== "object") return []
    const ld = listData as Record<string, unknown>
    return ld["sessions"] ?? ld["data"] ?? []
  })()

  const sessionsArray = Array.isArray(rawSessions) ? rawSessions : []

  const sessions: NeonSessionInfo[] = sessionsArray.map((raw) => {
    const s = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}

    const id =
      typeof s.id === "string"
        ? s.id
        : typeof s.sessionId === "string"
          ? s.sessionId
          : typeof s.token === "string"
            ? s.token
            : ""

    const token = typeof s.token === "string" ? s.token : undefined

    const userAgent =
      typeof s.userAgent === "string"
        ? s.userAgent
        : typeof s.user_agent === "string"
          ? s.user_agent
          : null

    const ipAddress =
      typeof s.ipAddress === "string"
        ? s.ipAddress
        : typeof s.ip_address === "string"
          ? s.ip_address
          : null

    const createdAt = toDate(s.createdAt ?? s.created_at)
    const updatedAt = toDate(s.updatedAt ?? s.updated_at, createdAt)
    const expires = toDate(s.expiresAt ?? s.expires_at ?? s.expires, createdAt)

    const { device, browser, os } = parseUserAgent(userAgent)

    return {
      id: String(id),
      token,
      device,
      browser,
      os,
      ipAddress,
      lastActive: updatedAt,
      expires,
      createdAt,
      isCurrent: Boolean(currentSessionId && id && id === currentSessionId),
    }
  })

  return { currentSessionId, sessions }
}

export async function revokeNeonSession(sessionId: string): Promise<void> {
  const { sessions } = await listNeonSessions()
  const token = sessions.find((s) => s.id === sessionId)?.token
  if (!token) {
    throw new Error("Session not found")
  }

  const res = (await auth.revokeSession({ token })) as { error?: { message?: string } | null }
  if (res?.error) {
    throw new Error(res.error.message ?? "Failed to revoke session")
  }
}

export async function revokeOtherNeonSessions(): Promise<void> {
  const res = (await auth.revokeOtherSessions()) as { error?: { message?: string } | null }
  if (res?.error) {
    throw new Error(res.error.message ?? "Failed to revoke other sessions")
  }
}

