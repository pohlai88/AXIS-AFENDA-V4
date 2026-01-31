import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { createNeonAuth } from "@neondatabase/auth/next/server"

import { HEADER_NAMES, COOKIE_NAMES } from "./lib/constants"

const NEON_AUTH_SESSION_DATA_COOKIE_NAME = "__Secure-neon-auth.local.session_data"

function isPublicPath(pathname: string): boolean {
  // Public pages / assets / auth endpoints.
  const publicPrefixes = [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/auth",
    "/api/auth",
    "/api/test-env",
    "/api/test-auth",
    "/_next",
    "/favicon.ico",
    "/robots.txt",
  ]

  return publicPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

async function getUserIdFromSessionDataCookie(
  sessionDataCookie: string,
  cookieSecret: string
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(sessionDataCookie, new TextEncoder().encode(cookieSecret), {
      algorithms: ["HS256"],
    })
    const data = payload as unknown as { user?: { id?: string | null } | null }
    return data.user?.id ?? null
  } catch {
    return null
  }
}

export default async function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  const { pathname, search } = req.nextUrl

  // Request ID (use existing if caller provided one)
  const requestId = requestHeaders.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID()
  requestHeaders.set(HEADER_NAMES.REQUEST_ID, requestId)

  // Tenant ID (cookie -> header)
  const tenantId = req.cookies.get(COOKIE_NAMES.TENANT_ID)?.value
  if (tenantId) requestHeaders.set(HEADER_NAMES.TENANT_ID, tenantId)

  // If Neon Auth isn't configured yet, keep proxy as a no-op (keeps builds/dev usable).
  const baseUrl = process.env.NEON_AUTH_BASE_URL
  const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET
  const neonConfigured = Boolean(baseUrl && cookieSecret && cookieSecret.length >= 32)

  // Auth protection: only enforced when Neon Auth is configured.
  if (neonConfigured && !isPublicPath(pathname)) {
    const auth = createNeonAuth({
      baseUrl: baseUrl!,
      cookies: { secret: cookieSecret! },
    })

    const authRes = await auth.middleware({ loginUrl: "/auth/sign-in" })(req)
    // If the auth middleware redirected, return it immediately.
    if (authRes.headers.get("location")) {
      return authRes
    }

    // Try to get user id from session data cookie (existing or minted by auth middleware).
    const sessionDataCookie =
      req.cookies.get(NEON_AUTH_SESSION_DATA_COOKIE_NAME)?.value ??
      authRes.cookies.get(NEON_AUTH_SESSION_DATA_COOKIE_NAME)?.value ??
      null

    const userId = sessionDataCookie
      ? await getUserIdFromSessionDataCookie(sessionDataCookie, cookieSecret!)
      : null

    if (!userId) {
      // As a safe fallback: treat as unauthenticated.
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = "/auth/sign-in"
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`)
      return NextResponse.redirect(loginUrl)
    }

    requestHeaders.set(HEADER_NAMES.USER_ID, userId)

    const res = NextResponse.next({ request: { headers: requestHeaders } })

    // Preserve any cookies/headers set by Neon Auth middleware (session refresh + session_data mint).
    authRes.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        res.headers.append(key, value)
      }
    })

    res.headers.set(HEADER_NAMES.REQUEST_ID, requestId)
    if (tenantId) res.headers.set(HEADER_NAMES.TENANT_ID, tenantId)
    return res
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

