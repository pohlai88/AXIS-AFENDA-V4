import "@/lib/server/only"

import { cookies, headers } from "next/headers"

import { headerNames } from "@/lib/constants/headers"
import { getServerEnv } from "@/lib/env/server"

export type TenantContext = {
  tenantId: string | null
}

// Resolve tenant from request headers/cookies. (Auth integration may override this later.)
export async function getTenantContext(): Promise<TenantContext> {
  const h = await headers()
  const fromHeader = h.get(headerNames.tenantId)
  if (fromHeader) return { tenantId: fromHeader }

  // Keep in sync with middleware cookie name.
  const c = await cookies()
  const fromCookie = c.get("afenda_tenant_id")?.value
  if (fromCookie) return { tenantId: fromCookie }

  // Dev-only fallback so the app can run without tenant bootstrapping.
  if (getServerEnv().NODE_ENV !== "production") {
    return { tenantId: getServerEnv().DEV_TENANT_ID ?? "dev-tenant" }
  }

  return { tenantId: null }
}

