import "@/lib/server/only"

import { getServerSession } from "next-auth/next"
import { headers } from "next/headers"

import { getTenantContext } from "@/lib/server/tenant/context"
import authOptions from "@/auth"
import { getNeonAuthConfig, validateNeonAuthToken } from "./neon-integration"
import { decodeNeonJWT, extractUserIdFromJWT, extractUserRoleFromJWT } from "./jwt-utils"

export type AuthContext = {
  userId: string | null
  roles: string[]
  tenantId: string | null
  authSource: "nextauth" | "neon" | "none"
}

export async function getAuthContext(): Promise<AuthContext> {
  const [session, tenant] = await Promise.all([
    getServerSession(authOptions),
    getTenantContext(),
  ])

  // Try NextAuth first
  let userId = session?.user?.id ?? session?.user?.email ?? null
  let roles: string[] = []
  let authSource: AuthContext["authSource"] = "none"

  if (userId) {
    authSource = "nextauth"
  } else {
    // Try Neon Auth as fallback
    const neonConfig = getNeonAuthConfig()
    if (neonConfig.enabled) {
      const headersList = await headers()
      const authHeader = headersList.get("Authorization")

      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7)
        if (await validateNeonAuthToken(token)) {
          // Decode JWT and extract user information
          const payload = await decodeNeonJWT(token)
          if (payload) {
            userId = extractUserIdFromJWT(payload)
            const userRole = extractUserRoleFromJWT(payload)

            if (userId) {
              authSource = "neon"
              // Update roles based on JWT payload
              roles = [userRole]
            }
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

