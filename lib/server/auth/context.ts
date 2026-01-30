import "@/lib/server/only"

import { getServerSession } from "next-auth/next"

import { getTenantContext } from "@/lib/server/tenant/context"
import { authOptions } from "./options"

export type AuthContext = {
  userId: string | null
  roles: string[]
  tenantId: string | null
}

export async function getAuthContext(): Promise<AuthContext> {
  const [session, tenant] = await Promise.all([
    getServerSession(authOptions),
    getTenantContext(),
  ])

  const userId =
    session?.user?.id ??
    session?.user?.email ??
    null

  return {
    userId,
    roles: [],
    tenantId: tenant.tenantId,
  }
}

