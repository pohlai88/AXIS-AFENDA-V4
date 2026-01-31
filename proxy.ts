import { NextResponse, type NextRequest } from "next/server"
import { HEADER_NAMES, COOKIE_NAMES } from "./lib/constants"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const requestHeaders = new Headers(req.headers)

  // Request ID (use existing if caller provided one)
  const requestId = requestHeaders.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID()
  requestHeaders.set(HEADER_NAMES.REQUEST_ID, requestId)

  // Tenant ID (cookie -> header)
  const tenantId = req.cookies.get(COOKIE_NAMES.TENANT_ID)?.value
  if (tenantId) requestHeaders.set(HEADER_NAMES.TENANT_ID, tenantId)

  // Public paths that don't require authentication
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/auth/error",
    "/auth/verify-request",
    "/auth/new-user",
    "/api/auth",
    "/api/public",
    "/_next",
    "/favicon.ico",
    "/robots.txt",
  ]

  // Check if the path is public
  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(path + "/")
  )

  // Skip authentication for public paths
  if (!isPublicPath) {
    // Get the token from the request
    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
    })

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL("/login", req.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Role-based access control
    const protectedPaths = {
      "/admin": ["admin"],
      "/settings": ["user", "admin"],
      "/api/admin": ["admin"],
      "/api/user": ["user", "admin"],
    }

    // Check if path requires specific role
    for (const [path, requiredRoles] of Object.entries(protectedPaths)) {
      if (pathname.startsWith(path)) {
        const userRole = token.role as string

        if (!requiredRoles.includes(userRole)) {
          // Redirect to unauthorized page or home
          const unauthorizedUrl = new URL("/auth/unauthorized", req.url)
          return NextResponse.redirect(unauthorizedUrl)
        }
        break
      }
    }

    // Add user info to headers for API routes
    if (token.id) {
      requestHeaders.set("x-user-id", token.id as string)
      requestHeaders.set("x-user-role", token.role as string || "user")
    }
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

