/**
 * Storage keys for localStorage and sessionStorage.
 * These are used to persist data across sessions.
 */
export const STORAGE_KEYS = {
  UI: {
    /** Sidebar collapsed state */
    SIDEBAR_STATE: "ui.sidebarState",
    /** Theme preference */
    THEME: "ui.theme",
    /** Language preference */
    LANGUAGE: "ui.language",
    /** Table column preferences */
    TABLE_COLUMNS: "ui.tableColumns",
    /** Dashboard layout */
    DASHBOARD_LAYOUT: "ui.dashboardLayout",
  },
  USER: {
    /** Authenticated user id (legacy key) */
    ID: "userId",
    /** Authenticated user role (legacy key) */
    ROLE: "userRole",
    /** Recently viewed items */
    RECENT_ITEMS: "user.recentItems",
    /** Search history */
    SEARCH_HISTORY: "user.searchHistory",
    /** Form drafts */
    FORM_DRAFTS: "user.formDrafts",
  },
  CACHE: {
    /** API response cache */
    API_CACHE: "cache.api",
    /** Image cache */
    IMAGE_CACHE: "cache.images",
    /** Metadata cache */
    METADATA_CACHE: "cache.metadata",
  },
} as const

// Simplified type definition
export type StorageKeyPath =
  | "userId"
  | "userRole"
  | "ui.sidebarState"
  | "ui.theme"
  | "ui.language"
  | "ui.tableColumns"
  | "ui.dashboardLayout"
  | "user.recentItems"
  | "user.searchHistory"
  | "user.formDrafts"
  | "cache.api"
  | "cache.images"
  | "cache.metadata"

// Legacy exports for backward compatibility
/** @deprecated Use STORAGE_KEYS.UI.SIDEBAR_STATE instead */
export const storageKeys = STORAGE_KEYS
