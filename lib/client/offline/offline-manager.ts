"use client"

/**
 * Offline manager - orchestrates all offline functionality
 * Handles connection status, sync coordination, and event management
 */

import { OFFLINE_STATUS, OFFLINE_EVENTS, OFFLINE_STORAGE_KEYS, SYNC_CONFIG, SYNC_STATUS } from "@/lib/constants"
import { offlineUtils, taskStorage, projectStorage, conflictStorage } from "./storage"
import { syncQueue } from "./sync-queue"
import { conflictResolver } from "./conflict-resolver"
import type { OfflineTask, OfflineProject } from "./storage"

export interface OfflineState {
  status: "online" | "offline" | "syncing" | "sync_error"
  lastSyncAt?: Date
  pendingCount: number
  conflictCount: number
}

class OfflineManager {
  private currentStatus: "online" | "offline" | "syncing" | "sync_error" = "online"
  private syncInterval: NodeJS.Timeout | null = null
  private clientId: string | null = null

  constructor() {
    this.initialize()
  }

  /**
   * Initialize offline functionality
   */
  private async initialize(): Promise<void> {
    // Check if IndexedDB is available
    const storageAvailable = await offlineUtils.isStorageAvailable()
    if (!storageAvailable) {
      console.warn("Offline storage not available")
      return
    }

    // Get or generate client ID
    this.clientId = this.getOrCreateClientId()

    // Set up online/offline event listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline.bind(this))
      window.addEventListener("offline", this.handleOffline.bind(this))

      // Check current status
      this.currentStatus = navigator.onLine ? "online" : "offline"
    }

    // Start periodic sync if online
    if (this.isOnline()) {
      this.startPeriodicSync()
    }
  }

  /**
   * Get or create a unique client ID
   */
  private getOrCreateClientId(): string {
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEYS.CLIENT_ID)
    if (stored) {
      return stored
    }

    const newId = offlineUtils.generateClientId()
    localStorage.setItem(OFFLINE_STORAGE_KEYS.CLIENT_ID, newId)
    return newId
  }

  /**
   * Handle coming back online
   */
  private async handleOnline(): Promise<void> {
    this.setStatus("online" as any)
    this.startPeriodicSync()

    // Immediately try to sync pending changes
    await this.syncAll()
  }

  /**
   * Handle going offline
   */
  private handleOffline(): void {
    this.setStatus("offline")
    this.stopPeriodicSync()
  }

  /**
   * Set offline status and emit event
   */
  private setStatus(status: "online" | "offline" | "syncing" | "sync_error"): void {
    this.currentStatus = status
    this.dispatchEvent(OFFLINE_EVENTS.STATUS_CHANGED, { status })
  }

  /**
   * Start periodic sync
   */
  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline()) {
        this.syncAll()
      }
    }, SYNC_CONFIG.SYNC_INTERVAL)
  }

  /**
   * Stop periodic sync
   */
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Sync all pending changes
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline() || this.currentStatus === "syncing") {
      return
    }

    this.setStatus("syncing")

    try {
      // Get current user ID (this should come from auth context)
      const userId = await this.getCurrentUserId()
      if (!userId) {
        // User not authenticated - skip sync silently
        this.setStatus("online")
        return
      }

      // Process sync queue
      await syncQueue.processQueue(userId)

      // Pull latest changes from server
      await this.pullLatestChanges(userId)

      // Update last sync timestamp
      localStorage.setItem(
        OFFLINE_STORAGE_KEYS.LAST_SYNC,
        new Date().toISOString()
      )

      this.setStatus("online")
    } catch (error) {
      this.setStatus("sync_error")
      console.error("Sync failed:", error)
    }
  }

  /**
   * Pull latest changes from server
   */
  private async pullLatestChanges(userId: string): Promise<void> {
    const lastSync = localStorage.getItem(OFFLINE_STORAGE_KEYS.LAST_SYNC)
    const url = `/api/v1/sync/pull?since=${lastSync || ""}`

    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Pull failed: ${response.status}`)
      }

      const data = await response.json()

      // Process tasks
      if (data.tasks) {
        await this.processServerTasks(data.tasks, userId)
      }

      // Process projects
      if (data.projects) {
        await this.processServerProjects(data.projects, userId)
      }
    } catch (error) {
      console.error("Failed to pull changes:", error)
      throw error
    }
  }

  /**
   * Process server task updates
   */
  private async processServerTasks(tasks: OfflineTask[], userId: string): Promise<void> {
    for (const serverTask of tasks) {
      const localTask = await taskStorage.getById(serverTask.id) as OfflineTask | undefined

      if (!localTask) {
        // New task from server
        await taskStorage.upsert({
          ...serverTask,
          syncStatus: "synced" as const,
          clientGeneratedId: serverTask.clientGeneratedId || offlineUtils.generateClientId(),
        } as OfflineTask)
      } else if (localTask.syncStatus === "synced") {
        // No local changes, update from server
        await taskStorage.upsert({
          ...serverTask,
          syncStatus: "synced" as const,
          clientGeneratedId: localTask.clientGeneratedId,
        } as OfflineTask)
      } else {
        // Local changes exist, check for conflicts
        const resolution = await conflictResolver.resolveConflict(
          "task",
          localTask,
          serverTask
        )

        if (resolution.requiresUserInput) {
          await conflictStorage.add({
            userId,
            entityType: "task",
            entityId: serverTask.id,
            clientData: localTask,
            serverData: serverTask,
            conflictType: "field_conflict",
            resolved: false,
            createdAt: new Date(),
          })
        } else {
          // Auto-resolve
          await this.applyAutoResolution("task", localTask, resolution)
        }
      }
    }
  }

  /**
   * Process server project updates
   */
  private async processServerProjects(projects: OfflineProject[], userId: string): Promise<void> {
    for (const serverProject of projects) {
      const localProject = await projectStorage.getById(serverProject.id) as OfflineProject | undefined

      if (!localProject) {
        // New project from server
        await projectStorage.upsert({
          ...serverProject,
          syncStatus: "synced" as const,
          clientGeneratedId: serverProject.clientGeneratedId || offlineUtils.generateClientId(),
        } as OfflineProject)
      } else if (localProject.syncStatus === "synced") {
        // No local changes, update from server
        await projectStorage.upsert({
          ...serverProject,
          syncStatus: "synced" as const,
          clientGeneratedId: localProject.clientGeneratedId,
        } as OfflineProject)
      } else {
        // Local changes exist, check for conflicts
        const resolution = await conflictResolver.resolveConflict(
          "project",
          localProject,
          serverProject
        )

        if (resolution.requiresUserInput) {
          await conflictStorage.add({
            userId,
            entityType: "project",
            entityId: serverProject.id,
            clientData: localProject,
            serverData: serverProject,
            conflictType: "field_conflict",
            resolved: false,
            createdAt: new Date(),
          })
        } else {
          // Auto-resolve
          await this.applyAutoResolution("project", localProject, resolution)
        }
      }
    }
  }

  /**
   * Apply automatic resolution
   */
  private async applyAutoResolution(
    entityType: "task" | "project",
    localData: OfflineTask | OfflineProject,
    resolution: { strategy: string; resolvedData?: OfflineTask | OfflineProject | Record<string, unknown> }
  ): Promise<void> {
    const storage = entityType === "task" ? taskStorage : projectStorage

    if (resolution.strategy === "SERVER_WINS") {
      // Keep server version, mark as synced
      await storage.updateSyncStatus(localData.id, "synced")
    } else if (resolution.resolvedData) {
      // Apply merged data
      if (entityType === "task") {
        await taskStorage.upsert({
          ...resolution.resolvedData,
          syncStatus: "synced" as const,
          clientGeneratedId: localData.clientGeneratedId,
        } as OfflineTask)
      } else {
        await projectStorage.upsert({
          ...resolution.resolvedData,
          syncStatus: "synced" as const,
          clientGeneratedId: localData.clientGeneratedId,
        } as OfflineProject)
      }
    }
  }

  /**
   * Get current user ID (placeholder - should come from auth)
   */
  private async getCurrentUserId(): Promise<string | null> {
    // This should integrate with your auth system
    // For now, return a placeholder or get from auth context
    return localStorage.getItem("userId") || null
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus === "online"
  }

  /**
   * Get current offline state
   */
  async getState(): Promise<OfflineState> {
    const userId = await this.getCurrentUserId()
    const queueStatus = userId ? await syncQueue.getQueueStatus(userId) : { pending: 0, failed: 0, processing: false }
    const conflicts = userId ? await conflictResolver.getUnresolvedConflicts(userId) : []
    const lastSync = localStorage.getItem(OFFLINE_STORAGE_KEYS.LAST_SYNC)

    return {
      status: this.currentStatus,
      lastSyncAt: lastSync ? new Date(lastSync) : undefined,
      pendingCount: queueStatus.pending,
      conflictCount: conflicts.length,
    }
  }

  /**
   * Create a task offline
   */
  async createTaskOffline(taskData: Omit<OfflineTask, "id" | "userId" | "clientGeneratedId" | "syncStatus" | "syncVersion" | "createdAt" | "updatedAt">): Promise<OfflineTask> {
    const userId = await this.getCurrentUserId()
    if (!userId) {
      throw new Error("User not authenticated")
    }

    const offlineTask: OfflineTask = {
      ...taskData,
      id: offlineUtils.generateClientId(),
      userId,
      clientGeneratedId: offlineUtils.generateClientId(),
      syncStatus: "pending" as const,
      syncVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as OfflineTask

    await taskStorage.upsert(offlineTask)
    await syncQueue.queueTaskOperation(userId, "create", offlineTask)

    return offlineTask
  }

  /**
   * Update a task offline
   */
  async updateTaskOffline(taskId: string, updates: Partial<OfflineTask>): Promise<void> {
    const task = await taskStorage.getById(taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    const updatedTask = {
      ...task,
      ...updates,
      syncStatus: SYNC_STATUS.PENDING,
      syncVersion: task.syncVersion + 1,
      updatedAt: new Date(),
    }

    await taskStorage.upsert(updatedTask)
    await syncQueue.queueTaskOperation(task.userId, "update", updatedTask, task)
  }

  /**
   * Delete a task offline
   */
  async deleteTaskOffline(taskId: string): Promise<void> {
    const task = await taskStorage.getById(taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    await taskStorage.softDelete(taskId)
    await syncQueue.queueTaskOperation(task.userId, "delete", task, task)
  }

  /**
   * Dispatch custom events
   */
  private dispatchEvent(type: string, detail: Record<string, unknown>): void {
    const event = new CustomEvent(type, { detail })
    window.dispatchEvent(event)
  }

  /**
   * Cleanup on unmount
   */
  destroy(): void {
    this.stopPeriodicSync()
    syncQueue.cancelRetries()
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager()
