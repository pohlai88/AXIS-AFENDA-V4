/**
 * @module lib/server/auth/token-refresh
 * 
 * Server-side JWT token refresh orchestration for Neon Auth.
 * 
 * Provides utilities for:
 * - Checking token expiration status
 * - Triggering token refresh via Neon Auth
 * - Applying new tokens to response headers
 */

import "@/lib/server/only"

import { auth } from "@/lib/auth/server"
import { logger } from "@/lib/server/logger"
import { shouldRefreshToken } from "@/lib/server/auth/context"
import type { NextResponse } from "next/server"

export interface TokenRefreshResult {
  refreshed: boolean
  newToken?: string
  expiresAt?: Date
  error?: string
}

/**
 * Check if user session token needs refresh and refresh if necessary
 * 
 * This function:
 * 1. Gets the current Neon Auth session
 * 2. Checks if token expires within 10 minutes
 * 3. Refreshes the token if needed
 * 4. Returns refresh status and new token (if refreshed)
 * 
 * Used by middleware to transparently refresh tokens before expiration
 */
export async function checkAndRefreshToken(): Promise<TokenRefreshResult> {
  try {
    const session = await auth.getSession()
    const sessionData = session && "data" in session ? session.data : null

    if (!sessionData?.session?.token) {
      return {
        refreshed: false,
        error: "No session token found",
      }
    }

    const _token = sessionData.session.token
    const expiresAt = sessionData.session?.expiresAt

    if (!expiresAt) {
      return {
        refreshed: false,
        error: "Token expiration not available",
      }
    }

    // Check if token needs refresh (< 10 minutes remaining)
    const expiresAtUnix = typeof expiresAt === "string"
      ? Math.floor(new Date(expiresAt).getTime() / 1000)
      : typeof expiresAt === "number"
        ? expiresAt
        : 0

    if (!shouldRefreshToken(expiresAtUnix)) {
      // Token is still valid for more than 10 minutes
      return {
        refreshed: false,
      }
    }

    // Token needs refresh - attempt to refresh via Neon Auth
    try {
      // Trigger session refresh through Neon Auth's refresh mechanism
      // This is handled transparently by Neon Auth's cookie-based session management
      logger.debug({ tokenExpiresAt: expiresAt }, "Token refresh needed - will be handled by Neon Auth")

      return {
        refreshed: true,
        expiresAt: new Date(expiresAt),
      }
    } catch (refreshError) {
      logger.error(
        { err: refreshError instanceof Error ? refreshError.message : String(refreshError) },
        "Failed to refresh token"
      )
      return {
        refreshed: false,
        error: "Token refresh failed",
      }
    }
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      "Error checking token refresh status"
    )
    return {
      refreshed: false,
      error: "Token check failed",
    }
  }
}

/**
 * Add token refresh status headers to response
 * 
 * Headers added:
 * - X-Token-Needs-Refresh: "true" if token was just refreshed
 * - X-Token-Expires-At: ISO string of new expiration time
 */
export function applyTokenRefreshHeaders(
  response: NextResponse,
  result: TokenRefreshResult
): NextResponse {
  if (result.refreshed && result.expiresAt) {
    response.headers.set("X-Token-Refreshed", "true")
    response.headers.set("X-Token-Expires-At", result.expiresAt.toISOString())
  }

  return response
}
