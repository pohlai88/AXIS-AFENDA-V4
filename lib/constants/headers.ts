/**
 * Standard HTTP headers used throughout the application.
 */
export const HEADER_NAMES = {
  /** Request ID header for tracing */
  REQUEST_ID: "x-request-id",
  /** Tenant ID header for multi-tenancy */
  TENANT_ID: "x-tenant-id",
  /** Organization ID header for org-scoped operations */
  ORGANIZATION_ID: "x-organization-id",
  /** Authenticated user id (internal tenancy boundary) */
  USER_ID: "x-user-id",
  /** Authenticated user role (optional) */
  USER_ROLE: "x-user-role",
  /** API version for response governance */
  API_VERSION: "x-api-version",
} as const

export type HeaderNameKey = keyof typeof HEADER_NAMES
export type HeaderNameValue = (typeof HEADER_NAMES)[HeaderNameKey]

// Legacy exports for backward compatibility
/** @deprecated Use HEADER_NAMES instead */
export const headerNames = HEADER_NAMES
/** @deprecated Use HeaderNameKey instead */
export type HeaderNames = HeaderNameKey
