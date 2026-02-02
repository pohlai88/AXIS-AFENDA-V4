export type InferTenantOptions = {
  /**
   * The canonical app base URL (used to determine base hostname).
   * Example: https://nexuscanon.com
   */
  baseUrl: string | null | undefined
  /**
   * Reserved/public subdomains that should not be treated as tenant IDs.
   */
  publicSubdomains: string[]
  /**
   * Subdomain validation pattern (RFC 1123 compatible).
   */
  pattern: string
}

/**
 * Infer tenant identifier from an HTTP host header.
 *
 * This is intentionally side-effect free and safe to use in Edge (Proxy) and Node (route handlers).
 */
export function inferTenantFromHost(host: string | null, opts: InferTenantOptions): string | null {
  if (!host) return null

  const hostname = host.split(":")[0]
  if (!hostname) return null

  const baseUrl = opts.baseUrl
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

  if (opts.publicSubdomains.map((s) => s.toLowerCase()).includes(subdomain.toLowerCase())) return null

  try {
    if (!new RegExp(opts.pattern, "i").test(subdomain)) return null
  } catch {
    // Invalid regex pattern, fallback to simple RFC 1123-ish validation
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(subdomain)) return null
  }

  return subdomain
}

