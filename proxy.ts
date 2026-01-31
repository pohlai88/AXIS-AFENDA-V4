import "@/lib/server/only"

import { NextResponse, type NextRequest } from "next/server"
import { HEADER_NAMES, COOKIE_NAMES } from "./lib/constants"

export async function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)

  // Request ID (use existing if caller provided one)
  const requestId = requestHeaders.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID()
  requestHeaders.set(HEADER_NAMES.REQUEST_ID, requestId)

  // Tenant ID (cookie -> header)
  const tenantId = req.cookies.get(COOKIE_NAMES.TENANT_ID)?.value
  if (tenantId) requestHeaders.set(HEADER_NAMES.TENANT_ID, tenantId)

  // NOTE: NextAuth has been removed. Route protection will be reintroduced using Neon Auth.
  // For now this proxy only injects request/tenant context headers.

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Also expose request id on the response for debugging/tracing.
  res.headers.set(HEADER_NAMES.REQUEST_ID, requestId)
  if (tenantId) res.headers.set(HEADER_NAMES.TENANT_ID, tenantId)

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

