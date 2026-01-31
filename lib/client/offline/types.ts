/**
 * TypeScript types for offline functionality
 */

import type {
  Task,
  Project,
  TaskCreate,
  TaskUpdate,
  ProjectCreate,
  ProjectUpdate,
} from "@/lib/contracts/tasks"
import {
  OFFLINE_STATUS,
  SYNC_STATUS,
  SYNC_OPERATION,
  CONFLICT_STRATEGY,
  type OfflineStatusValue,
  type SyncStatusValue,
  type SyncOperationValue,
  type ConflictStrategyValue,
} from "@/lib/constants"

// Enhanced entity types for offline storage
export interface OfflineTask extends Omit<Task, "id"> {
  id: string // Can be client-generated or server ID
  userId: string
  syncStatus: SyncStatusValue
  syncVersion: number
  lastSyncedAt?: Date
  clientGeneratedId: string
  isDeleted?: boolean
}

export interface OfflineProject extends Omit<Project, "id"> {
  id: string // Can be client-generated or server ID
  userId: string
  syncStatus: SyncStatusValue
  syncVersion: number
  lastSyncedAt?: Date
  clientGeneratedId: string
  isDeleted?: boolean
}

// Sync queue types
export interface SyncQueueItem {
  id?: string
  userId: string
  entityType: "task" | "project"
  entityId: string
  operation: SyncOperationValue
  data: TaskCreate | TaskUpdate | ProjectCreate | ProjectUpdate | Record<string, unknown>
  clientGeneratedId?: string
  retryCount: number
  lastRetryAt?: Date
  createdAt: Date
  processedAt?: Date
}

// Conflict types
export interface SyncConflict {
  id?: string
  userId: string
  entityType: "task" | "project"
  entityId: string
  clientData: Task | Project | Record<string, unknown>
  serverData: Task | Project | null | Record<string, unknown>
  conflictType: "version_conflict" | "delete_conflict" | "field_conflict"
  resolved: boolean
  resolutionStrategy?: ConflictStrategyValue
  resolvedData?: Task | Project | Record<string, unknown> | null
  createdAt: Date
  resolvedAt?: Date
}

// Conflict resolution types
export interface ConflictResolution {
  strategy: ConflictStrategyValue
  resolvedData?: Task | Project | Record<string, unknown> | null
  requiresUserInput?: boolean
}

// Offline state types
export interface OfflineState {
  status: OfflineStatusValue
  lastSyncAt?: Date
  pendingCount: number
  conflictCount: number
}

// Sync status types
export interface SyncStatus {
  pending: number
  failed: number
  processing: boolean
  lastSync?: Date
}

// Event types
export interface OfflineEventDetail {
  status?: OfflineStatusValue
  entityType?: string
  operation?: string
  entityId?: string
  error?: Error
  conflictId?: string
  strategy?: ConflictStrategyValue
}

// PWA types
export interface PwaInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export interface PwaConfig {
  name: string
  shortName: string
  description: string
  themeColor: string
  backgroundColor: string
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser"
  orientation: "portrait" | "landscape" | "any"
  startUrl: string
  scope: string
  icons: PwaIcon[]
}

export interface PwaIcon {
  src: string
  sizes: string
  type: string
  purpose?: "any" | "maskable" | "monochrome"
}

// Cache types
export interface CacheEntry<T = Record<string, unknown>> {
  data: T
  timestamp: number
  expiresAt?: number
  etag?: string
}

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxAge?: number // Maximum age before refresh
  version?: string // Cache version for invalidation
}

// Network types
export interface NetworkRequestOptions {
  method?: string
  headers?: Record<string, string>
  body?: Record<string, unknown> | string | FormData
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface NetworkResponse<T = Record<string, unknown>> {
  data: T
  status: number
  statusText: string
  headers: Record<string, string>
  fromCache: boolean
}

// Storage types
export interface StorageQuota {
  used: number
  available: number
  total: number
  percentage: number
}

export interface StorageStats {
  tasks: number
  projects: number
  syncQueue: number
  conflicts: number
  total: number
}

// Background sync types
export interface BackgroundSyncTask {
  id: string
  type: "sync" | "upload" | "download"
  data: Record<string, unknown>
  priority: "low" | "normal" | "high"
  retryCount: number
  maxRetries: number
  nextRetryAt: Date
}

// Reconnection types
export interface ReconnectionConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

export interface ReconnectionState {
  isRetrying: boolean
  retryCount: number
  nextRetryAt?: Date
  lastError?: Error
}
