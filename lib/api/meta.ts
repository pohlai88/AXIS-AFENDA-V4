import { HEADER_NAMES } from "@/lib/constants/headers"

export type ApiTier = "public" | "bff" | "ops" | "internal"
export type ApiStatus = "current" | "legacy"

export type ApiDeprecation = {
  /** Standard header: `Deprecation: true` */
  deprecation: true
  /** Standard header: `Sunset: <RFC1123 date>` */
  sunset: string
  /** Standard header: `Link: <...>; rel="deprecation"` */
  link: string
}

export type ApiMeta = {
  version: string
  tier: ApiTier
  status: ApiStatus
  /** If present, route is deprecated/legacy and provides migration info */
  deprecation?: ApiDeprecation
}

export const API_VERSION = "1.0.0" as const

type Rule = {
  /** Match by request pathname (e.g. `/api/v1/`) */
  prefix: string
  meta: Omit<ApiMeta, "version">
}

/**
 * Single source of truth for classifying API routes.
 *
 * Rules are evaluated top-to-bottom; first match wins.
 */
const RULES: Rule[] = [
  // Public, durable API (versioned)
  { prefix: "/api/v1/", meta: { tier: "public", status: "current" } },

  // Ops / internal (explicitly labeled)
  { prefix: "/api/cron/", meta: { tier: "ops", status: "current" } },
  { prefix: "/api/debug/", meta: { tier: "internal", status: "legacy" } }, // dev-only; treat as non-public
  { prefix: "/api/internal/", meta: { tier: "internal", status: "current" } },

  // Legacy ops namespaces (keep working but mark legacy)
  {
    prefix: "/api/admin/",
    meta: {
      tier: "ops",
      status: "legacy",
      deprecation: {
        deprecation: true,
        // Example date; update when you schedule removal.
        sunset: "Wed, 31 Dec 2026 23:59:59 GMT",
        link: '<https://example.com/docs/api-migration>; rel="deprecation"',
      },
    },
  },
  {
    prefix: "/api/test-env",
    meta: {
      tier: "internal",
      status: "legacy",
      deprecation: {
        deprecation: true,
        sunset: "Wed, 31 Dec 2026 23:59:59 GMT",
        link: '<https://example.com/docs/api-migration>; rel="deprecation"',
      },
    },
  },

  // BFF (feature-first)
  { prefix: "/api/forgot-password", meta: { tier: "bff", status: "current" } },
  { prefix: "/api/reset-password", meta: { tier: "bff", status: "current" } },
  { prefix: "/api/verify-email", meta: { tier: "bff", status: "current" } },
  { prefix: "/api/orchestra/", meta: { tier: "bff", status: "current" } },
  { prefix: "/api/auth/", meta: { tier: "bff", status: "current" } },
]

export function getApiMetaForPath(pathname: string): ApiMeta | null {
  if (!pathname.startsWith("/api/")) return null

  for (const rule of RULES) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix)) {
      return { version: API_VERSION, ...rule.meta }
    }
  }

  // Default: treat unknown `/api/*` as BFF/current.
  return { version: API_VERSION, tier: "bff", status: "current" }
}

export function applyApiGovernanceHeaders(res: Response, meta: ApiMeta): Response {
  res.headers.set(HEADER_NAMES.API_VERSION, meta.version)
  res.headers.set("x-api-tier", meta.tier)
  res.headers.set("x-api-status", meta.status)

  if (meta.deprecation) {
    res.headers.set("Deprecation", "true")
    res.headers.set("Sunset", meta.deprecation.sunset)
    res.headers.set("Link", meta.deprecation.link)
  }

  return res
}

