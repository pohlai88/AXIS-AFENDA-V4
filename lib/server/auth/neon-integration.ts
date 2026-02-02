import { getServerEnv } from "@/lib/env/server"

export interface NeonAuthConfig {
  enabled: boolean
  dataApiUrl: string
  /**
   * Optional HMAC secret used ONLY for JWT verification fallback when JWKS is unavailable.
   * This is NOT a user token and must never be sent as an Authorization bearer token.
   */
  jwtVerificationSecret?: string
  projectId?: string
  branchId?: string
  jwksUrl?: string
  authBaseUrl?: string
}

export function getNeonAuthConfig(): NeonAuthConfig {
  const env = getServerEnv()

  return {
    enabled: Boolean(
      env.NEON_AUTH_BASE_URL || env.NEXT_PUBLIC_NEON_AUTH_URL
    ),
    // Neon Data API is optional; only required if you use `lib/server/neon/data-api.ts`.
    dataApiUrl: env.NEON_DATA_API_URL ?? "",
    projectId: env.NEON_PROJECT_ID,
    branchId: env.NEON_BRANCH_ID,
    authBaseUrl: env.NEON_AUTH_BASE_URL,
  }
}
