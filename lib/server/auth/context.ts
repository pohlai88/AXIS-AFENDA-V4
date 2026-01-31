import "@/lib/server/only"

import { headers } from "next/headers"

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

  // NOTE: NextAuth has been removed. Until Neon Auth session integration lands,
  // we support two lightweight auth sources:
  // - x-user-id header (used by current client stores)
  // - Neon Auth Bearer token (used for Data API auth)

  let userId = headersList.get(HEADER_NAMES.USER_ID)
  const userRoleHeader = headersList.get(HEADER_NAMES.USER_ROLE)
  let roles: string[] = userRoleHeader ? [userRoleHeader] : []
  let authSource: AuthContext["authSource"] = userId ? "header" : "none"

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

