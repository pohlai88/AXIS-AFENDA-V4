import { NextResponse, type NextRequest } from "next/server"

import { HEADER_NAMES, COOKIE_NAMES } from "./lib/constants"
import { applyApiGovernanceHeaders, getApiMetaForPath } from "./lib/api/meta"

export default async function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)
  const { pathname } = req.nextUrl

  // Generate nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
  const isDev = process.env.NODE_ENV === "development"

  // Content Security Policy
  // Note: Using nonces for application scripts + hash fallback for Next.js internal scripts
  // style-src allows 'unsafe-inline' for Neon Auth UI components and React inline styles
  // NOTE: Neon Auth UI components require 'unsafe-inline' - nonce is NOT used for styles
  // because when nonce is present, 'unsafe-inline' is ignored per CSP spec
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'sha256-rbbnijHn7DZ6ps39myQ3cVQF1H+U/PJfHh5ei/Q2kb8=' ${isDev ? "'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://images.unsplash.com;
    font-src 'self';
    connect-src 'self' ${isDev ? "ws: wss:" : ""};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
  const contentSecurityPolicyHeaderValue = cspHeader.replace(/\s{2,}/g, " ").trim()

  // Request ID (use existing if caller provided one)
  const requestId = requestHeaders.get(HEADER_NAMES.REQUEST_ID) ?? crypto.randomUUID()
  requestHeaders.set(HEADER_NAMES.REQUEST_ID, requestId)

  // Set nonce header for Next.js to extract
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicyHeaderValue)

  // Tenant ID (header -> cookie -> host)
  const headerTenantId = requestHeaders.get(HEADER_NAMES.TENANT_ID)
  const cookieTenantId = req.cookies.get(COOKIE_NAMES.TENANT_ID)?.value

  const tenantId =
    headerTenantId ??
    cookieTenantId ??
    inferTenantFromHost(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    )

  if (tenantId && !headerTenantId) requestHeaders.set(HEADER_NAMES.TENANT_ID, tenantId)

  // Extract user ID from Neon Auth session
  // Neon Auth sets the session in __Secure-neon-auth cookies
  // const neonAuthCookie = req.cookies.getAll().find((c) => c.name.startsWith("__Secure-neon-auth"))

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

  // Set CSP header on response
  res.headers.set("Content-Security-Policy", contentSecurityPolicyHeaderValue)

  // Also expose request id on the response for debugging/tracing.
  res.headers.set(HEADER_NAMES.REQUEST_ID, requestId)
  if (tenantId) res.headers.set(HEADER_NAMES.TENANT_ID, tenantId)

  const apiMeta = getApiMetaForPath(pathname)
  if (apiMeta) {
    applyApiGovernanceHeaders(res, apiMeta)
  }

  return res
}

/**
 * Infer tenant from subdomain
 * 
 * Flow:
 * 1. Extract subdomain from hostname (e.g., "tenant1" from "tenant1.nexuscanon.com")
 * 2. Filter out reserved subdomains (www, app, api, admin, etc.)
 * 3. Validate subdomain format (RFC 1123 compatible)
 * 4. Return subdomain as tenant ID or null
 * 
 * Note: In the future, this could query the subdomain_config database table
 * to dynamically map subdomains to organization/team IDs. For now, the 
 * subdomain itself serves as the tenant ID.
 */
function inferTenantFromHost(host: string | null): string | null {
  if (!host) return null

  const hostname = host.split(":")[0]
  if (!hostname) return null

  // Development: localhost fallback
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return process.env.DEV_TENANT_ID ?? null
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) return null

  let baseHostname: string | null = null
  try {
    baseHostname = new URL(baseUrl).hostname
  } catch {
    baseHostname = null
  }

  if (!baseHostname) return null
  if (!hostname.endsWith(baseHostname)) return null

  const subdomain = hostname.slice(0, -baseHostname.length).replace(/\.$/, "")
  if (!subdomain) return null

  // Filter out public/reserved subdomains
  const publicSubdomains = (process.env.NEXT_PUBLIC_PUBLIC_SUBDOMAINS ?? "www,app,api,admin,docs,blog,status,cdn").split(",").map(s => s.trim())
  if (publicSubdomains.includes(subdomain.toLowerCase())) return null

  // Validate subdomain pattern (RFC 1123 compatible)
  const pattern = process.env.NEXT_PUBLIC_TENANT_SUBDOMAIN_PATTERN ?? "^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$"
  try {
    if (!new RegExp(pattern, "i").test(subdomain)) return null
  } catch {
    // Invalid regex pattern, fallback to simple validation
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(subdomain)) return null
  }

  return subdomain
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes (already have CSP via governance headers if needed)
     * - Static files (_next/static)
     * - Image optimization (_next/image)
     * - Favicon
     * - Service worker scripts (must not be transformed)
     * - Prefetch requests (don't need CSP overhead)
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|sw.js|register-sw.js).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
}

