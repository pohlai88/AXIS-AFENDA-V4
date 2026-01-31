/**
 * Offline mode and synchronization constants.
 * Centralized constants for offline functionality, sync status, and storage.
 */

/**
 * Application offline/connection status.
 */
export const OFFLINE_STATUS = {
  /** Online and connected to server */
  ONLINE: "online",
  /** No network connection */
  OFFLINE: "offline",
  /** Currently synchronizing data */
  SYNCING: "syncing",
  /** Sync failed, will retry */
  SYNC_ERROR: "sync_error",
} as const

export type OfflineStatusKey = keyof typeof OFFLINE_STATUS
export type OfflineStatusValue = (typeof OFFLINE_STATUS)[OfflineStatusKey]

/**
 * Sync status for individual records.
 */
export const SYNC_STATUS = {
  /** Record is synced with server */
  SYNCED: "synced",
  /** Record has local changes pending sync */
  PENDING: "pending",
  /** Record has conflicts that need resolution */
  CONFLICT: "conflict",
  /** Record marked for deletion (pending sync) */
  DELETED: "deleted",
} as const

export type SyncStatusKey = keyof typeof SYNC_STATUS
export type SyncStatusValue = (typeof SYNC_STATUS)[SyncStatusKey]

/**
 * Sync operation types.
 */
export const SYNC_OPERATION = {
  /** Create new record */
  CREATE: "create",
  /** Update existing record */
  UPDATE: "update",
  /** Delete record */
  DELETE: "delete",
} as const

export type SyncOperationKey = keyof typeof SYNC_OPERATION
export type SyncOperationValue = (typeof SYNC_OPERATION)[SyncOperationKey]

/**
 * Conflict resolution strategies.
 */
export const CONFLICT_STRATEGY = {
  /** Server wins, overwrite local changes */
  SERVER_WINS: "server_wins",
  /** Client wins, overwrite server changes */
  CLIENT_WINS: "client_wins",
  /** Merge fields when possible */
  MERGE: "merge",
  /** User must manually resolve */
  MANUAL: "manual",
} as const

export type ConflictStrategyKey = keyof typeof CONFLICT_STRATEGY
export type ConflictStrategyValue = (typeof CONFLICT_STRATEGY)[ConflictStrategyKey]

/**
 * Storage keys for offline data in localStorage.
 */
export const OFFLINE_STORAGE_KEYS = {
  /** Last successful sync timestamp */
  LAST_SYNC: "offline.lastSync",
  /** Pending operations queue */
  PENDING_OPERATIONS: "offline.pendingOps",
  /** Unresolved conflicts */
  CONFLICTS: "offline.conflicts",
  /** Unique client identifier */
  CLIENT_ID: "offline.clientId",
  /** Sync settings and preferences */
  SETTINGS: "offline.settings",
} as const

export type OfflineStorageKeyPath = (typeof OFFLINE_STORAGE_KEYS)[keyof typeof OFFLINE_STORAGE_KEYS]

/**
 * IndexedDB store names.
 */
export const IDB_STORES = {
  /** Local tasks cache */
  TASKS: "tasks",
  /** Local projects cache */
  PROJECTS: "projects",
  /** Sync operation queue */
  SYNC_QUEUE: "syncQueue",
  /** Conflict records */
  CONFLICTS: "conflicts",
} as const

export type IdbStoreKey = keyof typeof IDB_STORES

/**
 * Sync configuration defaults.
 */
export const SYNC_CONFIG = {
  /** Maximum retry attempts for failed sync */
  MAX_RETRY_ATTEMPTS: 3,
  /** Base delay for exponential backoff (ms) */
  RETRY_BASE_DELAY: 1000,
  /** Maximum delay for retry (ms) */
  RETRY_MAX_DELAY: 30000,
  /** Batch size for sync operations */
  BATCH_SIZE: 50,
  /** Sync interval when online (ms) */
  SYNC_INTERVAL: 30000,
  /** Timeout for sync requests (ms) */
  SYNC_TIMEOUT: 10000,
} as const

/**
 * PWA configuration.
 */
export const PWA_CONFIG = {
  /** Cache name prefix */
  CACHE_PREFIX: "afenda-v1",
  /** Static assets cache name */
  STATIC_CACHE: "afenda-static-v1",
  /** API responses cache name */
  API_CACHE: "afenda-api-v1",
  /** Offline page URL */
  OFFLINE_PAGE: "/offline",
  /** Maximum age for cached API responses (ms) */
  API_CACHE_MAX_AGE: 5 * 60 * 1000, // 5 minutes
} as const

/**
 * Event names for offline/sync events.
 */
export const OFFLINE_EVENTS = {
  /** Connection status changed */
  STATUS_CHANGED: "offline:status-changed",
  /** Sync started */
  SYNC_STARTED: "offline:sync-started",
  /** Sync completed successfully */
  SYNC_COMPLETED: "offline:sync-completed",
  /** Sync failed */
  SYNC_FAILED: "offline:sync-failed",
  /** Conflict detected */
  CONFLICT_DETECTED: "offline:conflict-detected",
  /** Conflict resolved */
  CONFLICT_RESOLVED: "offline:conflict-resolved",
} as const
