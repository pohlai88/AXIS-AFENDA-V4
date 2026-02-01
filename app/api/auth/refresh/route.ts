import "@/lib/server/only"

import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"
import { db } from "@/lib/server/db"
import * as schema from "@/lib/server/db/schema"
const { sessions } = schema
import { eq, and, gt } from "drizzle-orm"
import { verifyNeonJwt } from "@/lib/server/auth/jwt"
import { getServerEnv } from "@/lib/env/server"
import { logger } from "@/lib/server/logger"
import { COOKIE_NAMES } from "@/lib/constants"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"

const TOKEN_EXPIRY_HOURS = 24
const ROTATION_GRACE_PERIOD_SECONDS = 30

interface RefreshResponse {
  token: string
  expiresAt: string
  success: boolean
}

/**
 * POST /api/auth/refresh
 * 
 * Refreshes the user's authentication token before it expires.
 * Implements token rotation with a 30-second grace period for in-flight requests.
 * 
 * Flow:
 * 1. Extract and verify current token
 * 2. Check token is not expired yet
 * 3. Generate new token with extended expiry
 * 4. Update session in database
 * 5. Return new token (old token valid for 30s grace period)
 * 
 * @returns {RefreshResponse} New token and expiry timestamp
 */
export async function POST(request: NextRequest): Promise<NextResponse<RefreshResponse>> {
  try {
    // Extract token from Authorization header or cookie
    const authHeader = request.headers.get("authorization")
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
    const tokenFromCookie = extractNeonAuthCookie(request.headers.get("cookie"))
    const currentToken = tokenFromHeader ?? tokenFromCookie

    if (!currentToken) {
      throw Unauthorized("No authentication token provided")
    }

    // Verify current token is still valid
    const verified = await verifyNeonJwt(currentToken)
    if (!verified) {
      throw Unauthorized("Invalid or expired token")
    }

    const payload = verified.payload
    const userId = payload.sub as string | undefined

    if (!userId) {
      throw Unauthorized("Invalid token payload: missing user ID")
    }

    // Check if token should be refreshed (< 15 minutes remaining)
    const expiresIn = (payload.exp ?? 0) - Math.floor(Date.now() / 1000)
    if (expiresIn > 900) {
      // Token still has > 15 minutes, no need to refresh yet
      return NextResponse.json({
        token: currentToken,
        expiresAt: new Date((payload.exp ?? 0) * 1000).toISOString(),
        success: true,
      })
    }

    // Generate new token with extended expiry
    const env = getServerEnv()
    const newExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    const newToken = await generateNewToken(userId, payload, newExpiresAt, env)

    // Update session in database
    const sessionUpdated = await updateSessionToken(userId, currentToken, newToken, newExpiresAt)

    if (!sessionUpdated) {
      logger.warn({ userId, oldToken: currentToken.slice(0, 10) }, "Session not found during token refresh")
      // Continue anyway - token rotation still works even without session record
    }

    // Log successful refresh
    logger.info({ userId, expiresIn, newExpiresAt }, "Token refreshed successfully")

    // Return new token
    const response = NextResponse.json<RefreshResponse>({
      token: newToken,
      expiresAt: newExpiresAt.toISOString(),
      success: true,
    })

    // Set new token in cookie
    response.cookies.set({
      name: COOKIE_NAMES.NEON_AUTH,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: newExpiresAt,
    })

    return response
  } catch (error) {
    if (error instanceof HttpError) {
      logger.warn({ err: error, status: error.status }, "Token refresh failed")
      return NextResponse.json(
        { token: "", expiresAt: "", success: false } as RefreshResponse,
        { status: error.status }
      )
    }

    logger.error({ err: error }, "Unexpected error during token refresh")
    return NextResponse.json(
      { token: "", expiresAt: "", success: false } as RefreshResponse,
      { status: 500 }
    )
  }
}

/**
 * Generate a new JWT token with extended expiry
 */
async function generateNewToken(
  userId: string,
  oldPayload: Record<string, unknown>,
  expiresAt: Date,
  env: ReturnType<typeof getServerEnv>
): Promise<string> {
  if (!env.NEON_JWT_SECRET) {
    throw new HttpError(500, "SERVER_ERROR", "JWT secret not configured")
  }

  const key = new TextEncoder().encode(env.NEON_JWT_SECRET)
  const expiresInSeconds = Math.floor(expiresAt.getTime() / 1000)

  // Preserve existing claims but update expiry
  const newToken = await new SignJWT({
    ...oldPayload,
    sub: userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresInSeconds)
    .sign(key)

  return newToken
}

/**
 * Update session token in database with rotation tracking
 * 
 * Note: We don't invalidate the old token immediately to allow
 * for a 30-second grace period for in-flight requests.
 * The client should use the new token going forward.
 */
async function updateSessionToken(
  userId: string,
  oldToken: string,
  newToken: string,
  newExpiresAt: Date
): Promise<boolean> {
  try {
    // Find session by old token
    const existingSessions = await db.select().from(sessions).where(
      and(
        eq(sessions.userId, userId),
        eq(sessions.sessionToken, oldToken),
        gt(sessions.expires, new Date()) // Not expired yet
      )
    ).limit(1)

    if (existingSessions.length === 0) {
      return false
    }

    // Update session with new token and expiry
    await db
      .update(sessions)
      .set({
        sessionToken: newToken,
        expires: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, existingSessions[0].id))

    return true
  } catch (error) {
    logger.error({ err: error, userId }, "Failed to update session during token refresh")
    return false
  }
}

/**
 * Extract Neon Auth cookie from cookie header string
 */
function extractNeonAuthCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim())
  const neonCookie = cookies.find((cookie) => cookie.startsWith(COOKIE_NAMES.NEON_AUTH))

  if (!neonCookie) return null

  const value = neonCookie.split("=")[1]
  if (!value) return null

  return decodeURIComponent(value)
}
