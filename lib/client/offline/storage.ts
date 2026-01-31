"use client"

/**
 * Offline storage layer using IndexedDB via Dexie.js
 * Provides local storage for tasks, projects, and sync operations
 */

import Dexie, { type Table } from "dexie"
import type {
  Task,
  Project,
  TaskCreate,
  TaskUpdate,
  ProjectCreate,
  ProjectUpdate,
} from "@/lib/contracts/tasks"
import {
  IDB_STORES,
  SYNC_STATUS,
  SYNC_OPERATION,
  type SyncStatusValue,
  type SyncOperationValue,
} from "@/lib/constants"

// Enhanced types for offline storage
export interface OfflineTask extends Task {
  syncStatus: SyncStatusValue
  syncVersion: number
  lastSyncedAt?: Date
  clientGeneratedId: string
  isDeleted?: boolean
}

export interface OfflineProject extends Project {
  syncStatus: SyncStatusValue
  syncVersion: number
  lastSyncedAt?: Date
  clientGeneratedId: string
  isDeleted?: boolean
}

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

export interface SyncConflict {
  id?: string
  userId: string
  entityType: "task" | "project"
  entityId: string
  clientData: Task | Project | Record<string, unknown>
  serverData: Task | Project | null | Record<string, unknown>
  conflictType: "version_conflict" | "delete_conflict" | "field_conflict"
  resolved: boolean
  resolutionStrategy?: "SERVER_WINS" | "CLIENT_WINS" | "MERGE" | "MANUAL"
  resolvedData?: Task | Project | Record<string, unknown> | null
  createdAt: Date
  resolvedAt?: Date
}

class OfflineDatabase extends Dexie {
  tasks!: Table<OfflineTask>
  projects!: Table<OfflineProject>
  syncQueue!: Table<SyncQueueItem>
  conflicts!: Table<SyncConflict>

  constructor() {
    super("AfendaOfflineDB")

    this.version(1).stores({
      [IDB_STORES.TASKS]: "id, userId, projectId, status, syncStatus, clientGeneratedId, lastSyncedAt, isDeleted",
      [IDB_STORES.PROJECTS]: "id, userId, syncStatus, clientGeneratedId, lastSyncedAt, isDeleted",
      [IDB_STORES.SYNC_QUEUE]: "++id, userId, entityType, entityId, operation, createdAt, processedAt",
      [IDB_STORES.CONFLICTS]: "++id, userId, entityType, entityId, resolved, createdAt",
    })
  }
}

export const offlineDb = new OfflineDatabase()

/**
 * Task storage operations
 */
export const taskStorage = {
  /**
   * Get all tasks for a user
   */
  async getAll(userId: string): Promise<OfflineTask[]> {
    return await offlineDb.tasks
      .where("userId")
      .equals(userId)
      .and(task => !task.isDeleted)
      .toArray()
  },

  /**
   * Get a specific task by ID
   */
  async getById(id: string): Promise<OfflineTask | undefined> {
    return await offlineDb.tasks.get(id)
  },

  /**
   * Get a task by client-generated ID
   */
  async getByClientId(clientGeneratedId: string): Promise<OfflineTask | undefined> {
    return await offlineDb.tasks
      .where("clientGeneratedId")
      .equals(clientGeneratedId)
      .first()
  },

  /**
   * Create or update a task
   */
  async upsert(task: OfflineTask): Promise<void> {
    await offlineDb.tasks.put(task)
  },

  /**
   * Mark a task as deleted (soft delete)
   */
  async softDelete(id: string): Promise<void> {
    await offlineDb.tasks.update(id, {
      isDeleted: true,
      syncStatus: SYNC_STATUS.PENDING,
      updatedAt: new Date(),
    })
  },

  /**
   * Get tasks pending sync
   */
  async getPendingSync(userId: string): Promise<OfflineTask[]> {
    return await offlineDb.tasks
      .where("userId")
      .equals(userId)
      .and((task: OfflineTask) => Boolean(task.syncStatus === SYNC_STATUS.PENDING || task.isDeleted))
      .toArray()
  },

  /**
   * Update sync status
   */
  async updateSyncStatus(id: string, status: SyncStatusValue, version?: number): Promise<void> {
    const update: Partial<OfflineTask> = {
      syncStatus: status,
      lastSyncedAt: new Date(),
    }
    if (version !== undefined) {
      update.syncVersion = version
    }
    await offlineDb.tasks.update(id, update)
  },

  /**
   * Clear all tasks for a user
   */
  async clearAll(userId: string): Promise<void> {
    await offlineDb.tasks.where("userId").equals(userId).delete()
  },
}

/**
 * Project storage operations
 */
export const projectStorage = {
  /**
   * Get all projects for a user
   */
  async getAll(userId: string): Promise<OfflineProject[]> {
    return await offlineDb.projects
      .where("userId")
      .equals(userId)
      .and((project: OfflineProject) => !project.isDeleted)
      .toArray()
  },

  /**
   * Get a specific project by ID
   */
  async getById(id: string): Promise<OfflineProject | undefined> {
    return await offlineDb.projects.get(id)
  },

  /**
   * Get a project by client-generated ID
   */
  async getByClientId(clientGeneratedId: string): Promise<OfflineProject | undefined> {
    return await offlineDb.projects
      .where("clientGeneratedId")
      .equals(clientGeneratedId)
      .first()
  },

  /**
   * Create or update a project
   */
  async upsert(project: OfflineProject): Promise<void> {
    await offlineDb.projects.put(project)
  },

  /**
   * Mark a project as deleted (soft delete)
   */
  async softDelete(id: string): Promise<void> {
    await offlineDb.projects.update(id, {
      isDeleted: true,
      syncStatus: SYNC_STATUS.PENDING,
      updatedAt: new Date(),
    })
  },

  /**
   * Get projects pending sync
   */
  async getPendingSync(userId: string): Promise<OfflineProject[]> {
    return await offlineDb.projects
      .where("userId")
      .equals(userId)
      .and((project: OfflineProject) => Boolean(project.syncStatus === SYNC_STATUS.PENDING || project.isDeleted))
      .toArray()
  },

  /**
   * Update sync status
   */
  async updateSyncStatus(id: string, status: SyncStatusValue, version?: number): Promise<void> {
    const update: Partial<OfflineProject> = {
      syncStatus: status,
      lastSyncedAt: new Date(),
    }
    if (version !== undefined) {
      update.syncVersion = version
    }
    await offlineDb.projects.update(id, update)
  },

  /**
   * Clear all projects for a user
   */
  async clearAll(userId: string): Promise<void> {
    await offlineDb.projects.where("userId").equals(userId).delete()
  },
}

/**
 * Sync queue operations
 */
export const syncQueueStorage = {
  /**
   * Add an operation to the sync queue
   */
  async add(item: Omit<SyncQueueItem, "id">): Promise<string> {
    const id = await offlineDb.syncQueue.add(item as SyncQueueItem)
    return id.toString()
  },

  /**
   * Get pending operations for a user
   */
  async getPending(userId: string): Promise<SyncQueueItem[]> {
    return await offlineDb.syncQueue
      .where("userId")
      .equals(userId)
      .and((item: SyncQueueItem) => !item.processedAt)
      .toArray()
  },

  /**
   * Mark an operation as processed
   */
  async markProcessed(id: string): Promise<void> {
    await offlineDb.syncQueue.update(id, {
      processedAt: new Date(),
    })
  },

  /**
   * Update retry count
   */
  async updateRetry(id: string): Promise<void> {
    await offlineDb.syncQueue.update(id, {
      retryCount: new Date().getTime(), // Using timestamp as workaround
      lastRetryAt: new Date(),
    })
  },

  /**
   * Remove processed operations
   */
  async clearProcessed(userId: string): Promise<void> {
    await offlineDb.syncQueue
      .where("userId")
      .equals(userId)
      .and((item: SyncQueueItem) => !!item.processedAt)
      .delete()
  },
}

/**
 * Conflict storage operations
 */
export const conflictStorage = {
  /**
   * Add a conflict
   */
  async add(conflict: Omit<SyncConflict, "id">): Promise<string> {
    const id = await offlineDb.conflicts.add(conflict as SyncConflict)
    return id.toString()
  },

  /**
   * Get unresolved conflicts for a user
   */
  async getUnresolved(userId: string): Promise<SyncConflict[]> {
    return await offlineDb.conflicts
      .where("userId")
      .equals(userId)
      .and((conflict: SyncConflict) => !conflict.resolved)
      .toArray()
  },

  /**
   * Mark a conflict as resolved
   */
  async markResolved(id: string, strategy: SyncConflict["resolutionStrategy"], resolvedData: SyncConflict["resolvedData"]): Promise<void> {
    await offlineDb.conflicts.update(id, {
      resolved: true,
      resolutionStrategy: strategy,
      resolvedData,
      resolvedAt: new Date(),
    })
  },

  /**
   * Delete resolved conflicts
   */
  async clearResolved(userId: string): Promise<void> {
    await offlineDb.conflicts
      .where("userId")
      .equals(userId)
      .and(conflict => conflict.resolved)
      .delete()
  },
}

/**
 * Utility functions
 */
export const offlineUtils = {
  /**
   * Generate a client-side UUID
   */
  generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Check if storage is available
   */
  async isStorageAvailable(): Promise<boolean> {
    try {
      await offlineDb.open()
      return true
    } catch (error) {
      console.error("IndexedDB not available:", error)
      return false
    }
  },

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    await offlineDb.delete()
    await offlineDb.open()
  },
}
