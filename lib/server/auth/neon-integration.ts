import { getServerEnv } from "@/lib/env/server"

export interface NeonAuthConfig {
  enabled: boolean
  dataApiUrl: string
  jwtSecret?: string
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
    dataApiUrl: env.DATABASE_URL || "",
    jwtSecret: env.NEON_AUTH_COOKIE_SECRET,
    projectId: env.NEON_PROJECT_ID,
    authBaseUrl: env.NEON_AUTH_BASE_URL,
    jwksUrl: env.JWKS_URL,
  }
}
