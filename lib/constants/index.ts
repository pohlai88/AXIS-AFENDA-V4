/**
 * Application-wide constants standardized for consistency.
 * This file contains commonly used constants to avoid magic strings and ensure consistency.
 */

// Re-export from other constant files
export { HEADER_NAMES, type HeaderNameKey, type HeaderNameValue } from './headers'
export { STORAGE_KEYS, type StorageKeyPath } from './storage'

/**
 * Cookie names used throughout the application.
 */
export const COOKIE_NAMES = {
  /** Tenant ID cookie for multi-tenancy */
  TENANT_ID: "afenda_tenant_id",
  /** Session cookie name */
  SESSION: "next-auth.session-token",
  /** CSRF token cookie */
  CSRF_TOKEN: "next-auth.csrf-token",
  /** Callback URL cookie */
  CALLBACK_URL: "next-auth.callback-url",
  /** Theme preference cookie */
  THEME: "theme",
  /** UI state persistence cookie */
  UI_STATE: "ui-state",
} as const

export type CookieNameKey = keyof typeof COOKIE_NAMES
export type CookieNameValue = (typeof COOKIE_NAMES)[CookieNameKey]

// Legacy exports for backward compatibility
/** @deprecated Use COOKIE_NAMES.TENANT_ID instead */
export const TENANT_COOKIE = COOKIE_NAMES.TENANT_ID

/**
 * HTTP status codes and their meanings.
 */
export const HTTP_STATUS = {
  /** Success codes */
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  /** Redirection codes */
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  /** Client error codes */
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  /** Server error codes */
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

export type HttpStatusKey = keyof typeof HTTP_STATUS
export type HttpStatusValue = (typeof HTTP_STATUS)[HttpStatusKey]

/**
 * API error codes for consistent error handling.
 */
export const API_ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_TOKEN: "INVALID_TOKEN",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Rate limiting
  RATE_LIMITED: "RATE_LIMITED",
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS",

  // Server errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",

  // Business logic
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  RESOURCE_LOCKED: "RESOURCE_LOCKED",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
} as const

export type ApiErrorCodeKey = keyof typeof API_ERROR_CODES
export type ApiErrorCodeValue = (typeof API_ERROR_CODES)[ApiErrorCodeKey]

/**
 * Common time intervals in milliseconds.
 */
export const TIME_INTERVALS = {
  /** 1 second in milliseconds */
  SECOND: 1000,
  /** 1 minute in milliseconds */
  MINUTE: 60 * 1000,
  /** 1 hour in milliseconds */
  HOUR: 60 * 60 * 1000,
  /** 1 day in milliseconds */
  DAY: 24 * 60 * 60 * 1000,
  /** 1 week in milliseconds */
  WEEK: 7 * 24 * 60 * 60 * 1000,
  /** 1 month (30 days) in milliseconds */
  MONTH: 30 * 24 * 60 * 60 * 1000,
  /** 1 year (365 days) in milliseconds */
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const

export type TimeIntervalKey = keyof typeof TIME_INTERVALS
export type TimeIntervalValue = (typeof TIME_INTERVALS)[TimeIntervalKey]

/**
 * Pagination defaults and limits.
 */
export const PAGINATION = {
  /** Default page size */
  DEFAULT_PAGE_SIZE: 20,
  /** Maximum allowed page size */
  MAX_PAGE_SIZE: 200,
  /** Default page number */
  DEFAULT_PAGE: 1,
  /** Minimum page size */
  MIN_PAGE_SIZE: 1,
} as const

/**
 * Cache TTL values in milliseconds.
 */
export const CACHE_TTL = {
  /** Very short cache (5 seconds) */
  VERY_SHORT: 5 * 1000,
  /** Short cache (1 minute) */
  SHORT: TIME_INTERVALS.MINUTE,
  /** Medium cache (5 minutes) */
  MEDIUM: 5 * TIME_INTERVALS.MINUTE,
  /** Long cache (1 hour) */
  LONG: TIME_INTERVALS.HOUR,
  /** Very long cache (1 day) */
  VERY_LONG: TIME_INTERVALS.DAY,
  /** Default cache TTL */
  DEFAULT: 5 * TIME_INTERVALS.MINUTE,
} as const

export type CacheTtlKey = keyof typeof CACHE_TTL
export type CacheTtlValue = (typeof CACHE_TTL)[CacheTtlKey]

/**
 * Regular expression patterns.
 */
export const REGEX_PATTERNS = {
  /** Email validation */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** UUID validation */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  /** Permission format (resource.action) */
  PERMISSION: /^[a-z]+\.[a-z]+$/,
  /** Slug validation */
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /** Password strength (at least 8 chars, one uppercase, one lowercase, one number) */
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  /** Username validation (letters, numbers, underscores, hyphens) */
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  /** Phone number (international format) */
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const

export type RegexPatternKey = keyof typeof REGEX_PATTERNS
export type RegexPatternValue = (typeof REGEX_PATTERNS)[RegexPatternKey]

/**
 * Date and time formats.
 */
export const DATE_FORMATS = {
  /** ISO date format */
  ISO_DATE: "YYYY-MM-DD",
  /** ISO datetime format */
  ISO_DATETIME: "YYYY-MM-DDTHH:mm:ssZ",
  /** Display date format */
  DISPLAY_DATE: "MMM DD, YYYY",
  /** Display datetime format */
  DISPLAY_DATETIME: "MMM DD, YYYY HH:mm",
  /** Time format */
  TIME: "HH:mm:ss",
  /** Short date format */
  SHORT_DATE: "MM/DD/YYYY",
} as const

export type DateFormatKey = keyof typeof DATE_FORMATS
export type DateFormatValue = (typeof DATE_FORMATS)[DateFormatKey]

/**
 * Environment names.
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  TESTING: "testing",
  STAGING: "staging",
  PRODUCTION: "production",
} as const

export type EnvironmentKey = keyof typeof ENVIRONMENTS
export type EnvironmentValue = (typeof ENVIRONMENTS)[EnvironmentKey]

/**
 * Common MIME types.
 */
export const MIME_TYPES = {
  /** JSON */
  JSON: "application/json",
  /** Form data */
  FORM_DATA: "multipart/form-data",
  /** URL encoded */
  URL_ENCODED: "application/x-www-form-urlencoded",
  /** Plain text */
  TEXT: "text/plain",
  /** HTML */
  HTML: "text/html",
  /** CSS */
  CSS: "text/css",
  /** JavaScript */
  JAVASCRIPT: "application/javascript",
  /** PDF */
  PDF: "application/pdf",
  /** ZIP */
  ZIP: "application/zip",
  /** JPEG */
  JPEG: "image/jpeg",
  /** PNG */
  PNG: "image/png",
  /** SVG */
  SVG: "image/svg+xml",
} as const

export type MimeTypeKey = keyof typeof MIME_TYPES
export type MimeTypeValue = (typeof MIME_TYPES)[MimeTypeKey]

/**
 * Database query limits.
 */
export const DB_LIMITS = {
  /** Maximum rows for SELECT queries */
  MAX_SELECT_ROWS: 1000,
  /** Maximum rows for bulk inserts */
  MAX_BULK_INSERT: 500,
  /** Maximum rows for bulk updates */
  MAX_BULK_UPDATE: 500,
  /** Maximum rows for bulk deletes */
  MAX_BULK_DELETE: 500,
  /** Query timeout in seconds */
  QUERY_TIMEOUT: 30,
} as const

/**
 * File upload constraints.
 */
export const FILE_UPLOAD = {
  /** Maximum file size in bytes (10MB) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  /** Allowed image types */
  ALLOWED_IMAGE_TYPES: [MIME_TYPES.JPEG, MIME_TYPES.PNG, MIME_TYPES.SVG],
  /** Allowed document types */
  ALLOWED_DOCUMENT_TYPES: [MIME_TYPES.PDF],
  /** Maximum filename length */
  MAX_FILENAME_LENGTH: 255,
} as const
