import "@/lib/server/only"

import { headers } from "next/headers"

import { getServerEnv } from "@/lib/env/server"
import { getNeonAuth } from "@/lib/auth/server"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getNeonAuthConfig, validateNeonAuthToken } from "./neon-integration"
import { decodeNeonJWT, extractUserIdFromJWT, extractUserRoleFromJWT } from "./jwt-utils"
import { HEADER_NAMES } from "@/lib/constants/headers"

export type AuthContext = {
  userId: string | null
  roles: string[]
  tenantId: string | null
  authSource: "header" | "neon" | "none"
}

export async function getAuthContext(): Promise<AuthContext> {
  const [tenant, headersList] = await Promise.all([getTenantContext(), headers()])

  // Primary: Neon Auth session (cookie-based, via Neon Auth proxy route).
  // Fallback: x-user-id header (set by proxy middleware for existing API tenancy).
  // Fallback: Neon Auth Bearer token (used for Data API auth).

  let userId: string | null = null
  const userRoleHeader = headersList.get(HEADER_NAMES.USER_ROLE)
  let roles: string[] = []
  let authSource: AuthContext["authSource"] = "none"

  const env = getServerEnv()
  const neonSessionEnabled = Boolean(env.NEON_AUTH_BASE_URL && env.NEON_AUTH_COOKIE_SECRET)

  if (neonSessionEnabled) {
    try {
      const { data } = await getNeonAuth().getSession()
      const sessionUserId = data?.user?.id ?? null
      if (sessionUserId) {
        userId = sessionUserId
        authSource = "neon"
      }
    } catch {
      // If session lookup fails, fall back to header/token.
    }
  }

  // Fallback: proxy-injected header (keeps existing API tenancy working)
  if (!userId) {
    userId = headersList.get(HEADER_NAMES.USER_ID)
    if (userId) authSource = "header"
  }

  if (userRoleHeader && roles.length === 0) roles = [userRoleHeader]

  // Try Neon Auth as fallback (Bearer token)
  if (!userId) {
    const neonConfig = getNeonAuthConfig()
    if (neonConfig.enabled) {
      const authHeader = headersList.get("Authorization")

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7)
        if (await validateNeonAuthToken(token)) {
          const payload = await decodeNeonJWT(token)
          if (payload) {
            userId = extractUserIdFromJWT(payload)
            roles = userId ? [extractUserRoleFromJWT(payload)] : []
            authSource = userId ? "neon" : "none"
          }
        }
      }
    }
  }

  return {
    userId,
    roles,
    tenantId: tenant.tenantId,
    authSource,
  }
}

