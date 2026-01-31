import "@/lib/server/only"

import { createNeonAuth } from "@neondatabase/auth/next/server"

import { getServerEnv } from "@/lib/env/server"

/**
 * Lazily create Neon Auth server helper.
 *
 * IMPORTANT: Do not require env vars at module-evaluation time (keeps `pnpm build` green
 * in environments where Neon Auth isn't configured yet).
 */
export function getNeonAuth() {
  const env = getServerEnv()

  if (!env.NEON_AUTH_BASE_URL || !env.NEON_AUTH_COOKIE_SECRET) {
    throw new Error(
      "Neon Auth is not configured: set NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET."
    )
  }

  return createNeonAuth({
    baseUrl: env.NEON_AUTH_BASE_URL,
    cookies: {
      secret: env.NEON_AUTH_COOKIE_SECRET,
    },
  })
}

