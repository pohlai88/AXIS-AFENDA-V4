/**
 * Authentication Audit Logging
 * 
 * Tracks authentication events, login attempts, access failures, and session events.
 * Integrates with user_activity_log table for security monitoring.
 * 
 * @module lib/server/auth/audit-log
 */

import "@/lib/server/only"

import { getDb } from "@/lib/server/db"
import { securityEventLog, userActivityLog } from "@/lib/server/db/schema"
import { logger } from "@/lib/server/logger"
import { createHash } from "crypto"
import { withRlsDb } from "@/lib/server/db/rls"

/**
 * Authentication event types
 */
export type AuthEventAction =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'account_locked'
  | 'account_unlocked'
  | 'signup'
  | 'email_verified'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'access_denied'
  | 'session_created'
  | 'session_expired'
  | 'token_refresh'
  | 'oauth_signup'
  | 'oauth_login'
  | 'verification_email_sent'
  | 'verification_email_resent'

/**
 * Authentication event data
 */
export interface AuthEventData {
  userId?: string
  action: AuthEventAction
  success: boolean
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
  errorMessage?: string
}

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function sanitizeSecurityMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!metadata) return undefined
  const copy: Record<string, unknown> = { ...metadata }
  // Never store raw identifiers (email) in unauthenticated logs.
  if (typeof copy.email === "string") {
    delete copy.email
  }
  return copy
}

/**
 * Log authentication event to audit trail
 */
export async function logAuthEvent(event: AuthEventData): Promise<void> {
  try {
    // If we have a user id, write to the user-attributed audit log.
    if (event.userId) {
      const userId = event.userId
      await withRlsDb(userId, async (db) =>
        db.insert(userActivityLog).values({
          userId,
          action: event.action,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          metadata: event.metadata ?? undefined,
          createdAt: new Date(),
        })
      )

      logger.info(
        { userId, action: event.action, success: event.success },
        "Auth event logged"
      )
      return
    }

    // Otherwise write to unauthenticated security event log (enterprise monitoring).
    const email =
      event.metadata && typeof event.metadata.email === "string"
        ? event.metadata.email
        : undefined

    const identifierHash = email ? sha256Hex(email.toLowerCase()) : undefined
    const identifierType = email ? "email" : undefined

    const db = getDb()
    await db.insert(securityEventLog).values({
      userId: undefined,
      action: event.action,
      success: event.success,
      identifierHash,
      identifierType,
      requestId:
        event.metadata && typeof event.metadata.requestId === "string"
          ? event.metadata.requestId
          : undefined,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      errorMessage: event.errorMessage,
      metadata: sanitizeSecurityMetadata(event.metadata),
      createdAt: new Date(),
    })

    logger.info({ action: event.action, success: event.success }, "Security event logged")
  } catch (error) {
    // Don't fail the auth flow if logging fails
    logger.error({ event, err: error }, 'Failed to log auth event')
  }
}

/**
 * Log successful login
 */
export async function logLogin(
  userId: string,
  metadata?: {
    provider?: string
    sessionId?: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    userId,
    action: metadata?.provider ? 'oauth_login' : 'login',
    success: true,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    metadata: {
      provider: metadata?.provider,
      sessionId: metadata?.sessionId,
    },
  })
}

/**
 * Log failed login attempt
 */
export async function logLoginFailure(
  email: string,
  reason: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    action: 'login_failed',
    success: false,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    metadata: {
      email,
      reason,
    },
    errorMessage: reason,
  })
}

/**
 * Log user signup
 */
export async function logSignup(
  userId: string,
  metadata?: {
    provider?: string
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    userId,
    action: metadata?.provider ? 'oauth_signup' : 'signup',
    success: true,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    metadata: {
      provider: metadata?.provider,
    },
  })
}

/**
 * Log email verification
 */
export async function logEmailVerification(
  userId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    userId,
    action: 'email_verified',
    success: true,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  })
}

/**
 * Log password reset request
 */
export async function logPasswordResetRequest(
  userId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    userId,
    action: 'password_reset_requested',
    success: true,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  })
}

/**
 * Log password reset completion
 */
export async function logPasswordResetComplete(
  userId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    userId,
    action: 'password_reset_completed',
    success: true,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  })
}

/**
 * Log access denied
 */
export async function logAccessDenied(
  userId: string | undefined,
  resource: string,
  reason: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    userId,
    action: 'access_denied',
    success: false,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    metadata: {
      resource,
      reason,
    },
    errorMessage: reason,
  })
}

/**
 * Log session created
 */
export async function logSessionCreated(
  userId: string,
  sessionId: string,
  metadata?: {
    ipAddress?: string
    userAgent?: string
  }
): Promise<void> {
  await logAuthEvent({
    userId,
    action: 'session_created',
    success: true,
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
    metadata: {
      sessionId,
    },
  })
}

/**
 * Log session expired
 */
export async function logSessionExpired(
  userId: string,
  sessionId: string
): Promise<void> {
  await logAuthEvent({
    userId,
    action: 'session_expired',
    success: true,
    metadata: {
      sessionId,
    },
  })
}

/**
 * Extract IP address from request headers
 */
export function extractIpAddress(headers: Headers): string | undefined {
  // Check common proxy headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    undefined
  )
}

/**
 * Extract user agent from request headers
 */
export function extractUserAgent(headers: Headers): string | undefined {
  return headers.get('user-agent') || undefined
}
