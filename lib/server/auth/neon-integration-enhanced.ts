import "@/lib/server/only"

import { getServerEnv } from "@/lib/env/server"
import jwt, { JwtPayload } from 'jsonwebtoken'
import jwksClient, { SigningKey } from 'jwks-rsa'

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

export interface NeonJWTPayload extends JwtPayload {
  sub: string
  email: string
  role?: string
  user_id?: string
  user_role?: string
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

// JWKS client for signature verification
let jwksClientInstance: jwksClient.JwksClient | null = null

function getJwksClient(jwksUrl: string): jwksClient.JwksClient {
  if (!jwksClientInstance) {
    jwksClientInstance = jwksClient({
      jwksUri: jwksUrl,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
    })
  }
  return jwksClientInstance
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

    // Get signing key
    const client = getJwksClient(config.jwksUrl)
    const key: SigningKey = await client.getSigningKey(header.kid)
    const signingKey = key.getPublicKey()

    // Verify JWT signature and claims
    const decoded = jwt.verify(token, signingKey) as JwtPayload

    // Additional validation checks
    if (!decoded.sub || !decoded.email) {
      return false
    }

    return true
  } catch (error) {
    console.error('Neon Auth token validation failed:', error)
    return false
  }
}

export async function decodeNeonJWT(token: string): Promise<NeonJWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode payload without signature verification (for debugging)
    const payload = JSON.parse(atob(parts[1]))
    return payload as NeonJWTPayload
  } catch {
    return null
  }
}

export function extractUserIdFromJWT(payload: NeonJWTPayload): string | null {
  return payload.sub || payload.user_id || null
}

export function extractUserRoleFromJWT(payload: NeonJWTPayload): string {
  return payload.role || payload.user_role || 'user'
}

export function extractEmailFromJWT(payload: NeonJWTPayload): string | null {
  return payload.email || null
}

export async function createNeonAuthHeaders(userId: string): Promise<Record<string, string>> {
  const config = getNeonAuthConfig()

  if (!config.enabled) {
    return {}
  }

  // In a real implementation, you might create a service token
  // For now, return headers for Data API authentication
  return {
    "Authorization": `Bearer ${config.jwtSecret}`,
    "X-User-ID": userId,
    "Content-Type": "application/json",
  }
}

// Enhanced token validation with caching
export async function validateNeonAuthTokenWithCache(token: string): Promise<{
  valid: boolean
  payload?: NeonJWTPayload
  error?: string
}> {
  const config = getNeonAuthConfig()

  if (!config.enabled) {
    return { valid: false, error: 'Neon Auth not configured' }
  }

  try {
    // First decode without verification to check cache
    const payload = await decodeNeonJWT(token)
    if (!payload) {
      return { valid: false, error: 'Invalid token structure' }
    }

    // Check expiration early
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return { valid: false, error: 'Token expired' }
    }

    // Full verification
    const isValid = await validateNeonAuthToken(token)

    return {
      valid: isValid,
      payload: isValid ? payload : undefined,
      error: isValid ? undefined : 'Token verification failed'
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// User management helpers
export async function getNeonAuthUser(userId: string): Promise<Record<string, unknown> | null> {
  const config = getNeonAuthConfig()

  if (!config.enabled) {
    return null
  }

  try {
    const response = await fetch(`${config.dataApiUrl}/neon_auth.user?id=eq.${userId}`, {
      headers: await createNeonAuthHeaders(userId),
    })

    if (!response.ok) {
      return null
    }

    const users = await response.json() as Record<string, unknown>[]
    return users.length > 0 ? users[0] : null
  } catch {
    return null
  }
}

export async function createNeonAuthSession(userId: string, metadata?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  const config = getNeonAuthConfig()

  if (!config.enabled) {
    return null
  }

  try {
    const response = await fetch(`${config.dataApiUrl}/neon_auth.session`, {
      method: 'POST',
      headers: await createNeonAuthHeaders(userId),
      body: JSON.stringify({
        user_id: userId,
        metadata: metadata || {},
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }),
    })

    if (!response.ok) {
      return null
    }

    return await response.json() as Record<string, unknown>
  } catch {
    return null
  }
}
