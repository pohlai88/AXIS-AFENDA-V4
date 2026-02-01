import "@/lib/server/only"

import { jwtVerify, createRemoteJWKSet, type JWTPayload } from "jose"

import { getServerEnv } from "@/lib/env/server"
import { logger } from "@/lib/server/logger"

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null

export interface VerifiedToken {
  payload: JWTPayload
  raw: string
}

export async function verifyNeonJwt(token: string): Promise<VerifiedToken | null> {
  const env = getServerEnv()

  try {
    // Note: Legacy JWKS_URL and NEON_JWT_SECRET env vars are no longer needed
    // Neon Auth SDK handles JWT verification internally
    // This function is kept for backwards compatibility

    // If needed in the future, configure Neon Auth JWT verification instead
    // See: https://neon.tech/docs/guides/neon-auth

    logger.debug("JWT verification delegated to Neon Auth service")
    return null
  } catch (error) {
    logger.warn({ err: error }, "JWT verification failed")
    return null
  }
}
