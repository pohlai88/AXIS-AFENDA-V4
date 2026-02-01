import { NextResponse, type NextRequest } from "next/server"

import { HEADER_NAMES, COOKIE_NAMES } from "./lib/constants"

export default async function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  const { pathname } = req.nextUrl

  // Request ID (use existing if caller provided one)
  const requestId = requestHeaders.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID()
  requestHeaders.set(HEADER_NAMES.REQUEST_ID, requestId)

  // Tenant ID (cookie -> header)
  const tenantId = req.cookies.get(COOKIE_NAMES.TENANT_ID)?.value
  if (tenantId) requestHeaders.set(HEADER_NAMES.TENANT_ID, tenantId)

  // Extract user ID from Neon Auth session
  // Neon Auth sets the session in __Secure-neon-auth cookies
  const neonAuthCookie = req.cookies.getAll().find((c) => c.name.startsWith("__Secure-neon-auth"))
  
  // In production, you'd decode the session to get the actual user ID
  // For now, we set a placeholder that will be validated by getAuthContext()
  let userId = ""
  
  // Check for existing user ID in headers (from upstream)
  const existingUserId = requestHeaders.get(HEADER_NAMES.USER_ID)
  if (existingUserId && existingUserId !== "temp-user-id") {
    userId = existingUserId
  }
  
  // Only set if we have a valid user ID
  if (userId) {
    requestHeaders.set(HEADER_NAMES.USER_ID, userId)
  }

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

