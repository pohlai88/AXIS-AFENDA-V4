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
    if (env.JWKS_URL) {
      if (!cachedJwks) {
        cachedJwks = createRemoteJWKSet(new URL(env.JWKS_URL))
      }

      const { payload } = await jwtVerify(token, cachedJwks)
      return { payload, raw: token }
    }

    if (env.NEON_JWT_SECRET) {
      const key = new TextEncoder().encode(env.NEON_JWT_SECRET)
      const { payload } = await jwtVerify(token, key)
      return { payload, raw: token }
    }

    logger.warn("Neon JWT verification skipped: no JWKS_URL or NEON_JWT_SECRET configured")
    return null
  } catch (error) {
    logger.warn({ err: error }, "Neon JWT verification failed")
    return null
  }
}
