import "@/lib/server/only"

import { getNeonAuthConfig } from "./neon-integration"

export interface JWTPayload {
  sub?: string // user ID
  email?: string
  role?: string
  exp?: number // expiration
  iat?: number // issued at
  aud?: string // audience
  iss?: string // issuer
}

export async function decodeNeonJWT(token: string): Promise<JWTPayload | null> {
  const config = getNeonAuthConfig()
  
  if (!config.enabled) {
    return null
  }

  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode payload (without signature verification for now)
    const payload = JSON.parse(atob(parts[1]))
    
    // Check if token is expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null
    }

    return payload as JWTPayload
  } catch {
    return null
  }
}

export function extractUserIdFromJWT(payload: JWTPayload): string | null {
  // Try different user ID fields that Neon Auth might use
  return payload.sub || payload.email || null
}

export function extractUserRoleFromJWT(payload: JWTPayload): string {
  return payload.role || "user"
}
