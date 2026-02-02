import "@/lib/server/only"

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose"

import { getServerEnv } from "@/lib/env/server"
import { logger } from "@/lib/server/logger"

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null

/**
 * Expected Neon Auth JWT payload structure
 * Extends JWTPayload with Neon-specific claims
 */
export interface NeonJwtPayload extends JWTPayload {
  sub: string                    // Standard JWT subject (user ID)
  email?: string                 // User email
  email_verified?: boolean       // Email verification status
  name?: string                  // User display name
  picture?: string              // User avatar URL
  provider?: string             // OAuth provider name
  roles?: string[]              // User roles
  metadata?: Record<string, unknown> // Additional metadata
}

export interface VerifiedToken {
  payload: NeonJwtPayload
  raw: string
}

/**
 * Validate that JWT payload contains required claims
 */
function validateJwtPayload(payload: JWTPayload, token: string): payload is NeonJwtPayload {
  // Check for required 'sub' claim
  if (!payload.sub || typeof payload.sub !== "string") {
    logger.error(
      { tokenPreview: token.substring(0, 20) + "...", hasSub: !!payload.sub },
      "JWT validation failed: missing or invalid 'sub' claim"
    )
    return false
  }

  // Warn if email is missing (important for user context)
  if (!payload.email) {
    logger.warn(
      { sub: payload.sub, tokenPreview: token.substring(0, 20) + "..." },
      "JWT missing email claim - user context incomplete"
    )
  }

  return true
}

export async function verifyNeonJwt(token: string): Promise<VerifiedToken | null> {
  const env = getServerEnv()

  try {
    // Neon Auth session cookies may be opaque/encrypted. Only attempt verification
    // when the token looks like a JWT (3 dot-separated segments).
    // NOTE: This is expected behavior - not all Neon Auth tokens are JWTs
    const parts = token.split(".")
    if (parts.length !== 3) {
      // Silently return null - this is expected for opaque/encrypted session tokens
      // No need to log as this is normal Neon Auth behavior
      return null
    }

    if (!cachedJwks) {
      // Neon Auth JWKS is exposed under the auth base URL.
      // Example: <NEON_AUTH_BASE_URL>/.well-known/jwks.json
      const jwksUrl = new URL(".well-known/jwks.json", env.NEON_AUTH_BASE_URL.endsWith("/")
        ? env.NEON_AUTH_BASE_URL
        : `${env.NEON_AUTH_BASE_URL}/`)
      cachedJwks = createRemoteJWKSet(jwksUrl)
    }

    const verified = await jwtVerify(token, cachedJwks, {
      // Be permissive: Neon token issuer/audience can vary by environment.
      // Signature verification is the critical security property here.
      // issuer: env.NEON_AUTH_BASE_URL,
    })

    // Validate payload structure
    if (!validateJwtPayload(verified.payload, token)) {
      return null
    }

    return { payload: verified.payload, raw: token }
  } catch (error) {
    logger.warn(
      { err: error instanceof Error ? error.message : String(error) },
      "JWT verification failed"
    )
    return null
  }
}
