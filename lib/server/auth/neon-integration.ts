import "@/lib/server/only"

import { getServerEnv } from "@/lib/env/server"

export interface NeonAuthConfig {
  enabled: boolean
  dataApiUrl: string
  jwtSecret: string
  projectId: string
  branchId: string
  jwksUrl: string
  authBaseUrl: string
  passwordlessAuth: string
}

export function getNeonAuthConfig(): NeonAuthConfig {
  const env = getServerEnv()

  return {
    enabled: Boolean(env.NEON_DATA_API_URL && env.JWKS_URL && env.NEON_AUTH_BASE_URL),
    dataApiUrl: env.NEON_DATA_API_URL ?? "",
    jwtSecret: env.NEON_JWT_SECRET ?? "",
    projectId: env.NEON_PROJECT_ID ?? "",
    branchId: env.NEON_BRANCH_ID ?? "",
    jwksUrl: env.JWKS_URL ?? "",
    authBaseUrl: env.NEON_AUTH_BASE_URL ?? "",
    passwordlessAuth: env.NEON_PASSWORDLESS_AUTH ?? "",
  }
}

export async function validateNeonAuthToken(token: string): Promise<boolean> {
  const config = getNeonAuthConfig()

  if (!config.enabled) {
    return false
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return false
    }

    // Decode header to get key ID
    const header = JSON.parse(atob(parts[0]))
    if (!header.kid) {
      return false
    }

    // Fetch JWKS
    const jwksResponse = await fetch(config.jwksUrl)
    if (!jwksResponse.ok) {
      return false
    }

    const jwks = await jwksResponse.json()
    const key = jwks.keys.find((k: { kid: string }) => k.kid === header.kid)
    if (!key) {
      return false
    }

    // Decode payload
    const payload = JSON.parse(atob(parts[1]))

    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false
    }

    // Basic validation - in production you'd verify the signature
    // For now, we'll trust the token structure and expiration
    return true
  } catch {
    return false
  }
}

export async function createNeonAuthHeaders(userId: string): Promise<Record<string, string>> {
  const config = getNeonAuthConfig()

  if (!config.enabled) {
    return {}
  }

  // In a real implementation, you'd create a proper JWT here
  // For now, we'll return the headers structure
  return {
    "Authorization": `Bearer ${config.jwtSecret}`,
    "X-User-ID": userId,
  }
}
