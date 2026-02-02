/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/v1/me
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"

// Route Segment Config: Auth context is always dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  const h = await headers()
  const requestId = h.get(HEADER_NAMES.REQUEST_ID)

  const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])

  return ok({
    requestId,
    auth,
    tenant,
  })
}

