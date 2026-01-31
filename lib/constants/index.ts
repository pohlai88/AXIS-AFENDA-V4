/**
 * Application-wide constants standardized for consistency.
 * This file contains commonly used constants to avoid magic strings and ensure consistency.
 */

// Re-export from other constant files
export { HEADER_NAMES, type HeaderNameKey, type HeaderNameValue } from './headers'
export { STORAGE_KEYS, type StorageKeyPath } from './storage'
export {
  OFFLINE_STATUS,
  SYNC_STATUS,
  SYNC_OPERATION,
  CONFLICT_STRATEGY,
  OFFLINE_STORAGE_KEYS,
  IDB_STORES,
  SYNC_CONFIG,
  PWA_CONFIG,
  OFFLINE_EVENTS,
  type OfflineStatusKey,
  type OfflineStatusValue,
  type SyncStatusKey,
  type SyncStatusValue,
  type SyncOperationKey,
  type SyncOperationValue,
  type ConflictStrategyKey,
  type ConflictStrategyValue,
  type OfflineStorageKeyPath,
  type IdbStoreKey,
} from './offline'

/**
 * Cookie names used throughout the application.
 */
export const COOKIE_NAMES = {
  /** Tenant ID cookie for multi-tenancy */
  TENANT_ID: "afenda_tenant_id",
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
 * Logging defaults (server).
 *
 * Primary configuration uses env vars:
 * - LOG_LEVEL (trace|debug|info|warn|error|fatal)
 */
export const LOGGER = {
  /** Default level in development */
  DEFAULT_LEVEL_DEV: "debug",
  /** Default level in production */
  DEFAULT_LEVEL_PROD: "info",
  /** Redaction placeholder */
  REDACTION_CENSOR: "[redacted]",
} as const

/**
 * Circuit breaker defaults for outbound network calls.
 *
 * These are conservative defaults to prevent cascading failures.
 */
export const CIRCUIT_BREAKER = {
  /** Failures before opening the circuit */
  FAILURE_THRESHOLD: 5,
  /** Sliding window size for failures (number of attempts) */
  WINDOW_SIZE: 20,
  /** How long to stay open before allowing half-open probes (ms) */
  OPEN_DURATION_MS: 30 * TIME_INTERVALS.SECOND,
  /** Max probe calls allowed in half-open before closing/opening (count) */
  HALF_OPEN_MAX_PROBES: 2,
} as const

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

/**
 * Task filtering constants.
 */
export const TASK_FILTERING = {
  /** Sort options for task filtering */
  SORT_OPTIONS: {
    CREATED_AT: "createdAt",
    UPDATED_AT: "updatedAt",
    DUE_DATE: "dueDate",
    PRIORITY: "priority",
    TITLE: "title",
    STATUS: "status",
    COMPLETED_AT: "completedAt",
  },
  /** Sort order options */
  SORT_ORDER: {
    ASC: "asc",
    DESC: "desc",
  },
  /** Search match types */
  SEARCH_MATCH_TYPES: {
    CONTAINS: "contains",
    EXACT: "exact",
    FUZZY: "fuzzy",
  },
  /** Search field options */
  SEARCH_FIELDS: {
    TITLE: "title",
    DESCRIPTION: "description",
    TAGS: "tags",
    ALL: "all",
  },
  /** Filter include modes */
  INCLUDE_MODES: {
    ANY: "any",
    ALL: "all",
    NONE: "none",
  },
  /** Relative date range options */
  DATE_RANGES: {
    TODAY: "today",
    YESTERDAY: "yesterday",
    THIS_WEEK: "this_week",
    LAST_WEEK: "last_week",
    THIS_MONTH: "this_month",
    LAST_MONTH: "last_month",
    THIS_QUARTER: "this_quarter",
    LAST_QUARTER: "last_quarter",
    THIS_YEAR: "this_year",
    LAST_YEAR: "last_year",
    OVERDUE: "overdue",
    DUE_TODAY: "due_today",
    DUE_THIS_WEEK: "due_this_week",
    DUE_THIS_MONTH: "due_this_month",
  },
  /** Default filter values */
  DEFAULTS: {
    SORT_BY: "createdAt",
    SORT_ORDER: "desc",
    SEARCH_FIELDS: ["all"],
    SEARCH_MATCH_TYPE: "contains",
    INCLUDE_MODE: "any",
  },
} as const

export type TaskFilteringKey = keyof typeof TASK_FILTERING
export type TaskFilteringValue = (typeof TASK_FILTERING)[TaskFilteringKey]

/**
 * UI display constants for task filtering.
 */
export const TASK_FILTERING_UI = {
  /** Filter section labels */
  SECTION_LABELS: {
    SEARCH: "Search",
    DATE_RANGES: "Date Ranges",
    STATUS: "Status",
    PRIORITY: "Priority",
    PROJECTS: "Projects",
    QUICK_FILTERS: "Quick Filters",
    SORT_BY: "Sort By",
  },
  /** Filter option labels */
  OPTION_LABELS: {
    ALL: "All",
    TODAY: "Today",
    THIS_WEEK: "This Week",
    THIS_MONTH: "This Month",
    OVERDUE: "Overdue",
    DUE_TODAY: "Due Today",
    DUE_THIS_WEEK: "Due This Week",
    DUE_THIS_MONTH: "Due This Month",
    NEWEST_FIRST: "Newest First",
    OLDEST_FIRST: "Oldest First",
    MATCH_ANY: "Match Any",
    MATCH_ALL: "Match All",
    EXCLUDE_ALL: "Exclude All",
    CONTAINS: "Contains",
    EXACT: "Exact",
    FUZZY: "Fuzzy",
    ALL_FIELDS: "All Fields",
  },
  /** Accessibility labels */
  ARIA_LABELS: {
    FILTER_PANEL: "Advanced task filters",
    CLEAR_FILTERS: "Clear all filters",
    TOGGLE_FILTERS: "Toggle filter panel",
    ACTIVE_FILTER_COUNT: "Active filters count",
  },
  /** Filter descriptions */
  DESCRIPTIONS: {
    SEARCH: "Search across task title, description, and tags",
    DATE_RANGE: "Filter tasks by date range",
    STATUS_FILTER: "Filter by task status",
    PRIORITY_FILTER: "Filter by task priority",
    PROJECT_FILTER: "Filter by project assignment",
    QUICK_FILTERS: "Quick access filters",
    SORT_OPTIONS: "Sort tasks by selected field",
  },
} as const

export type TaskFilteringUiKey = keyof typeof TASK_FILTERING_UI
export type TaskFilteringUiValue = (typeof TASK_FILTERING_UI)[TaskFilteringUiKey]

/**
 * Organization and team management constants.
 */
export const ORGANIZATION = {
  /** Default organization role */
  DEFAULT_ROLE: "member",
  /** Organization roles */
  ROLES: {
    OWNER: "owner",
    ADMIN: "admin",
    MEMBER: "member",
  },
  /** Maximum name length */
  MAX_NAME_LENGTH: 255,
  /** Maximum slug length */
  MAX_SLUG_LENGTH: 100,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 1000,
} as const

export type OrganizationRoleKey = keyof typeof ORGANIZATION.ROLES
export type OrganizationRoleValue = (typeof ORGANIZATION.ROLES)[OrganizationRoleKey]

/**
 * Team management constants.
 */
export const TEAM = {
  /** Default team role */
  DEFAULT_ROLE: "member",
  /** Team roles */
  ROLES: {
    MANAGER: "manager",
    MEMBER: "member",
  },
  /** Maximum name length */
  MAX_NAME_LENGTH: 255,
  /** Maximum slug length */
  MAX_SLUG_LENGTH: 100,
  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 1000,
} as const

export type TeamRoleKey = keyof typeof TEAM.ROLES
export type TeamRoleValue = (typeof TEAM.ROLES)[TeamRoleKey]

/**
 * Permission system constants.
 */
export const PERMISSIONS = {
  // System permissions
  SYSTEM_ADMIN: "system:admin",
  SYSTEM_USER_MANAGE: "system:user:manage",

  // Organization permissions
  ORG_CREATE: "organization:create",
  ORG_READ: "organization:read",
  ORG_UPDATE: "organization:update",
  ORG_DELETE: "organization:delete",
  ORG_MANAGE: "organization:manage",
  ORG_MEMBER_INVITE: "organization:member:invite",
  ORG_MEMBER_MANAGE: "organization:member:manage",
  ORG_MEMBER_REMOVE: "organization:member:remove",
  ORG_TEAM_CREATE: "organization:team:create",
  ORG_TEAM_MANAGE: "organization:team:manage",
  ORG_SETTINGS_MANAGE: "organization:settings:manage",

  // Team permissions
  TEAM_CREATE: "team:create",
  TEAM_READ: "team:read",
  TEAM_UPDATE: "team:update",
  TEAM_DELETE: "team:delete",
  TEAM_MANAGE: "team:manage",
  TEAM_MEMBER_INVITE: "team:member:invite",
  TEAM_MEMBER_MANAGE: "team:member:manage",
  TEAM_MEMBER_REMOVE: "team:member:remove",
  TEAM_SETTINGS_MANAGE: "team:settings:manage",

  // Resource permissions (projects/tasks)
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  PROJECT_SHARE: "project:share",
  PROJECT_ADMIN: "project:admin",

  TASK_CREATE: "task:create",
  TASK_READ: "task:read",
  TASK_UPDATE: "task:update",
  TASK_DELETE: "task:delete",
  TASK_ASSIGN: "task:assign",
  TASK_COMMENT: "task:comment",

  // Sharing permissions
  SHARE_READ: "share:read",
  SHARE_WRITE: "share:write",
  SHARE_ADMIN: "share:admin",
} as const

export type PermissionKey = keyof typeof PERMISSIONS
export type PermissionValue = (typeof PERMISSIONS)[PermissionKey]

/**
 * Resource sharing constants.
 */
export const RESOURCE_SHARING = {
  /** Resource types */
  RESOURCE_TYPES: {
    PROJECT: "project",
    TASK: "task",
  },
  /** Share target types */
  TARGET_TYPES: {
    USER: "user",
    TEAM: "team",
    ORGANIZATION: "organization",
  },
  /** Permission levels */
  PERMISSION_LEVELS: {
    READ: "read",
    WRITE: "write",
    ADMIN: "admin",
  },
} as const

export type ResourceShareTypeKey = keyof typeof RESOURCE_SHARING.RESOURCE_TYPES
export type ResourceShareTypeValue = (typeof RESOURCE_SHARING.RESOURCE_TYPES)[ResourceShareTypeKey]
export type ShareTargetTypeKey = keyof typeof RESOURCE_SHARING.TARGET_TYPES
export type ShareTargetTypeValue = (typeof RESOURCE_SHARING.TARGET_TYPES)[ShareTargetTypeKey]
export type PermissionLevelKey = keyof typeof RESOURCE_SHARING.PERMISSION_LEVELS
export type PermissionLevelValue = (typeof RESOURCE_SHARING.PERMISSION_LEVELS)[PermissionLevelKey]
