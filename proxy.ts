import { NextResponse, type NextRequest } from "next/server"

// Keep Proxy self-contained (avoid shared imports/globals).
const X_REQUEST_ID = "x-request-id"
const X_TENANT_ID = "x-tenant-id"

const TENANT_COOKIE = "afenda_tenant_id"

export function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)

  // Request ID (use existing if caller provided one)
  const requestId = requestHeaders.get(X_REQUEST_ID) ?? crypto.randomUUID()
  requestHeaders.set(X_REQUEST_ID, requestId)

  // Tenant ID (cookie -> header)
  const tenantId = req.cookies.get(TENANT_COOKIE)?.value
  if (tenantId) requestHeaders.set(X_TENANT_ID, tenantId)

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Also expose request id on the response for debugging/tracing.
  res.headers.set(X_REQUEST_ID, requestId)
  if (tenantId) res.headers.set(X_TENANT_ID, tenantId)

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

