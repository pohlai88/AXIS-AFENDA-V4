"use client"

/**
 * Sync queue management for offline operations
 * Handles queuing, retrying, and processing of offline changes
 */

import { SYNC_CONFIG, SYNC_OPERATION, OFFLINE_EVENTS } from "@/lib/constants"
import { syncQueueStorage, taskStorage, projectStorage } from "./storage"
import type { SyncQueueItem, OfflineTask, OfflineProject } from "./storage"
import { offlineManager } from "./offline-manager"

export class SyncQueue {
  private isProcessing = false
  private retryTimeouts = new Map<string, NodeJS.Timeout>()

  /**
   * Add a task operation to the sync queue
   */
  async queueTaskOperation(
    userId: string,
    operation: "create" | "update" | "delete",
    task: OfflineTask,
    previousData?: OfflineTask
  ): Promise<void> {
    const queueItem: Omit<SyncQueueItem, "id"> = {
      userId,
      entityType: "task",
      entityId: task.id,
      operation,
      data: operation === "delete" ? { id: task.id, previousData } : task,
      clientGeneratedId: task.clientGeneratedId,
      retryCount: 0,
      createdAt: new Date(),
    }

    await syncQueueStorage.add(queueItem)

    // Update local sync status
    await taskStorage.updateSyncStatus(task.id, "pending")

    // Emit event
    this.dispatchEvent(OFFLINE_EVENTS.SYNC_STARTED, { entityType: "task", operation })

    // Try to sync immediately if online
    if (offlineManager.isOnline()) {
      this.processQueue(userId)
    }
  }

  /**
   * Add a project operation to the sync queue
   */
  async queueProjectOperation(
    userId: string,
    operation: "create" | "update" | "delete",
    project: OfflineProject,
    previousData?: OfflineProject
  ): Promise<void> {
    const queueItem: Omit<SyncQueueItem, "id"> = {
      userId,
      entityType: "project",
      entityId: project.id,
      operation,
      data: operation === "delete" ? { id: project.id, previousData } : project,
      clientGeneratedId: project.clientGeneratedId,
      retryCount: 0,
      createdAt: new Date(),
    }

    await syncQueueStorage.add(queueItem)

    // Update local sync status
    await projectStorage.updateSyncStatus(project.id, "pending")

    // Emit event
    this.dispatchEvent(OFFLINE_EVENTS.SYNC_STARTED, { entityType: "project", operation })

    // Try to sync immediately if online
    if (offlineManager.isOnline()) {
      this.processQueue(userId)
    }
  }

  /**
   * Process the sync queue for a user
   */
  async processQueue(userId: string): Promise<void> {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    try {
      const pendingItems = await syncQueueStorage.getPending(userId)

      // Process in batches
      for (let i = 0; i < pendingItems.length; i += SYNC_CONFIG.BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + SYNC_CONFIG.BATCH_SIZE)
        await this.processBatch(batch)
      }

      // Clean up processed items
      await syncQueueStorage.clearProcessed(userId)
    } catch (error) {
      console.error("Error processing sync queue:", error)
      this.dispatchEvent(OFFLINE_EVENTS.SYNC_FAILED, { error })
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Process a batch of sync operations
   */
  private async processBatch(items: SyncQueueItem[]): Promise<void> {
    const results = await Promise.allSettled(
      items.map(item => this.processItem(item))
    )

    // Handle failed items
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const item = items[index]
        this.handleFailedItem(item, result.reason)
      }
    })
  }

  /**
   * Process a single sync operation
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    const { entityType, operation, data, clientGeneratedId, entityId } = item

    try {
      let response: Response

      switch (entityType) {
        case "task":
          // Ensure data has required properties for syncTask
          const taskData = 'id' in data ? data : { ...data, id: entityId }
          response = await this.syncTask(operation, taskData as OfflineTask | { id: string; previousData?: OfflineTask }, clientGeneratedId)
          break
        case "project":
          // Ensure data has required properties for syncProject
          const projectData = 'id' in data ? data : { ...data, id: entityId }
          response = await this.syncProject(operation, projectData as OfflineProject | { id: string; previousData?: OfflineProject }, clientGeneratedId)
          break
        default:
          throw new Error(`Unknown entity type: ${entityType}`)
      }

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`)
      }

      // Mark as processed on success
      await syncQueueStorage.markProcessed(item.id || entityId)

      // Update local sync status
      if (operation !== "delete") {
        const storage = entityType === "task" ? taskStorage : projectStorage
        if ('id' in data && 'syncVersion' in data) {
          await storage.updateSyncStatus(data.id as string, "synced", data.syncVersion as number)
        }
      }

      this.dispatchEvent(OFFLINE_EVENTS.SYNC_COMPLETED, {
        entityType,
        operation,
        entityId: item.entityId,
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Sync a task operation
   */
  private async syncTask(
    operation: string,
    data: OfflineTask | { id: string; previousData?: OfflineTask },
    clientGeneratedId?: string
  ): Promise<Response> {
    const url = `/api/v1/tasks${operation === "create" ? "" : `/${data.id}`}`

    const options: RequestInit = {
      method: operation === "create" ? "POST" : operation === "update" ? "PATCH" : "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }

    if (operation !== "delete") {
      options.body = JSON.stringify({
        ...data,
        clientGeneratedId,
      })
    }

    const response = await fetch(url, options)
    return response
  }

  /**
   * Sync a project operation
   */
  private async syncProject(
    operation: string,
    data: OfflineProject | { id: string; previousData?: OfflineProject },
    clientGeneratedId?: string
  ): Promise<Response> {
    const url = `/api/v1/projects${operation === "create" ? "" : `/${data.id}`}`

    const options: RequestInit = {
      method: operation === "create" ? "POST" : operation === "update" ? "PATCH" : "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }

    if (operation !== "delete") {
      options.body = JSON.stringify({
        ...data,
        clientGeneratedId,
      })
    }

    const response = await fetch(url, options)
    return response
  }

  /**
   * Handle a failed sync item
   */
  private async handleFailedItem(item: SyncQueueItem, error: Error): Promise<void> {
    await syncQueueStorage.updateRetry(item.id!)
    item.retryCount++

    // Check if we should retry
    if (item.retryCount < SYNC_CONFIG.MAX_RETRY_ATTEMPTS) {
      const delay = Math.min(
        SYNC_CONFIG.RETRY_BASE_DELAY * Math.pow(2, item.retryCount),
        SYNC_CONFIG.RETRY_MAX_DELAY
      )

      const timeoutId = setTimeout(() => {
        this.processItem(item)
      }, delay)

      this.retryTimeouts.set(item.id!, timeoutId)
    } else {
      // Max retries reached, create a conflict
      this.dispatchEvent(OFFLINE_EVENTS.CONFLICT_DETECTED, {
        entityType: item.entityType,
        entityId: item.entityId,
        error,
      })
    }
  }

  /**
   * Cancel all pending retries
   */
  cancelRetries(): void {
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout))
    this.retryTimeouts.clear()
  }

  /**
   * Get queue status
   */
  async getQueueStatus(userId: string): Promise<{
    pending: number
    failed: number
    processing: boolean
  }> {
    const pending = await syncQueueStorage.getPending(userId)
    const failed = pending.filter(item => item.retryCount >= SYNC_CONFIG.MAX_RETRY_ATTEMPTS)

    return {
      pending: pending.length,
      failed: failed.length,
      processing: this.isProcessing,
    }
  }

  /**
   * Dispatch custom events
   */
  private dispatchEvent(type: string, detail: Record<string, unknown>): void {
    const event = new CustomEvent(type, { detail })
    window.dispatchEvent(event)
  }
}

// Export singleton instance
export const syncQueue = new SyncQueue()
