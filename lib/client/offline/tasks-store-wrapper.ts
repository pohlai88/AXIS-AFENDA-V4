"use client"

/**
 * Offline wrapper for tasks store - adds offline capabilities
 */

import { useEffect, useState } from "react"
import { offlineManager } from "./offline-manager"
import { taskStorage } from "./storage"
import type { TaskCreate, TaskUpdate } from "@/lib/contracts/tasks"
import type { SyncConflict } from "./types"
import { useAuth } from "@/lib/client/hooks/use-auth"
import type { OfflineTask } from "./storage"

export class OfflineTasksStoreWrapper {
  private originalStore: {
    tasks: OfflineTask[]
    createTask: (input: TaskCreate) => Promise<OfflineTask>
    updateTask: (id: string, input: TaskUpdate) => Promise<void>
    deleteTask: (id: string) => Promise<void>
    fetchTasks: () => Promise<void>
    setTasks: (tasks: OfflineTask[]) => void
    addTask: (task: OfflineTask) => void
    updateTaskInStore: (id: string, input: TaskUpdate) => void
    removeTask: (id: string) => void
  }
  private userId: string | null = null

  constructor(store: {
    tasks: OfflineTask[]
    createTask: (input: TaskCreate) => Promise<OfflineTask>
    updateTask: (id: string, input: TaskUpdate) => Promise<void>
    deleteTask: (id: string) => Promise<void>
    fetchTasks: () => Promise<void>
    setTasks: (tasks: OfflineTask[]) => void
    addTask: (task: OfflineTask) => void
    updateTaskInStore: (id: string, input: TaskUpdate) => void
    removeTask: (id: string) => void
  }) {
    this.originalStore = store
  }

  /**
   * Initialize with user ID
   */
  async initialize(userId: string): Promise<void> {
    this.userId = userId

    // Load tasks from offline storage
    await this.loadOfflineTasks()
  }

  /**
   * Load tasks from offline storage
   */
  private async loadOfflineTasks(): Promise<void> {
    if (!this.userId) return

    try {
      const offlineTasks = await taskStorage.getAll(this.userId)

      // Update the store with offline tasks
      this.originalStore.setTasks(offlineTasks)
    } catch (error) {
      console.error("Failed to load offline tasks:", error)
    }
  }

  /**
   * Create a task with offline support
   */
  async createTaskOffline(input: TaskCreate): Promise<OfflineTask> {
    if (!this.userId) {
      throw new Error("User not initialized")
    }

    try {
      // Try to create online first
      if (offlineManager.isOnline()) {
        try {
          const result = await this.originalStore.createTask(input)
          return result
        } catch (error) {
          console.log("Online create failed, falling back to offline:", error)
        }
      }

      // Create offline
      const offlineTask = await offlineManager.createTaskOffline({
        ...input,
        status: input.status || "todo",
        priority: input.priority || "medium",
      })

      // Update store immediately
      this.originalStore.addTask(offlineTask)

      return offlineTask
    } catch (error) {
      console.error("Failed to create task:", error)
      throw error
    }
  }

  /**
   * Update a task with offline support
   */
  async updateTaskOffline(id: string, input: TaskUpdate): Promise<void> {
    if (!this.userId) {
      throw new Error("User not initialized")
    }

    try {
      // Try to update online first
      if (offlineManager.isOnline()) {
        try {
          await this.originalStore.updateTask(id, input)
          return
        } catch (error) {
          console.log("Online update failed, falling back to offline:", error)
        }
      }

      // Update offline
      await offlineManager.updateTaskOffline(id, input)

      // Update store immediately
      this.originalStore.updateTaskInStore(id, input)
    } catch (error) {
      console.error("Failed to update task:", error)
      throw error
    }
  }

  /**
   * Update task status with offline support
   */
  async updateTaskStatusOffline(id: string, status: "todo" | "done"): Promise<void> {
    return this.updateTaskOffline(id, { status })
  }

  /**
   * Delete a task with offline support
   */
  async deleteTaskOffline(id: string): Promise<void> {
    if (!this.userId) {
      throw new Error("User not initialized")
    }

    try {
      // Try to delete online first
      if (offlineManager.isOnline()) {
        try {
          await this.originalStore.deleteTask(id)
          return
        } catch (error) {
          console.log("Online delete failed, falling back to offline:", error)
        }
      }

      // Delete offline
      await offlineManager.deleteTaskOffline(id)

      // Update store immediately
      this.originalStore.removeTask(id)
    } catch (error) {
      console.error("Failed to delete task:", error)
      throw error
    }
  }

  /**
   * Sync tasks with server
   */
  async syncTasks(): Promise<void> {
    if (!this.userId) return

    try {
      await offlineManager.syncAll()

      // Reload tasks after sync
      await this.loadOfflineTasks()

      // Also fetch from server if online
      if (offlineManager.isOnline()) {
        await this.originalStore.fetchTasks()
      }
    } catch (error) {
      console.error("Failed to sync tasks:", error)
    }
  }

  /**
   * Get sync status for a task
   */
  getTaskSyncStatus(taskId: string): "synced" | "pending" | "conflict" | "deleted" {
    const task = this.originalStore.tasks.find((t: OfflineTask) => t.id === taskId)
    return task?.syncStatus || "synced"
  }

  /**
   * Get pending tasks count
   */
  getPendingTasksCount(): number {
    return this.originalStore.tasks.filter((t: OfflineTask) => t.syncStatus === "pending").length
  }
}

/**
 * Hook to use offline-enabled tasks store
 */
export function useOfflineTasksStore(originalStore: {
  tasks: OfflineTask[]
  createTask: (input: TaskCreate) => Promise<OfflineTask>
  updateTask: (id: string, input: TaskUpdate) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  fetchTasks: () => Promise<void>
  setTasks: (tasks: OfflineTask[]) => void
  addTask: (task: OfflineTask) => void
  updateTaskInStore: (id: string, input: TaskUpdate) => void
  removeTask: (id: string) => void
}) {
  const [wrapper, setWrapper] = useState<OfflineTasksStoreWrapper | null>(null)
  const { userId } = useAuth() || { userId: null }

  useEffect(() => {
    if (userId && !wrapper) {
      const newWrapper = new OfflineTasksStoreWrapper(originalStore)
      newWrapper.initialize(userId).then(() => {
        setWrapper(newWrapper)
      })
    }
  }, [userId, originalStore, wrapper])

  // Listen for sync events
  useEffect(() => {
    const handleSyncCompleted = () => {
      if (wrapper) {
        wrapper.syncTasks()
      }
    }

    window.addEventListener("offline:sync-completed", handleSyncCompleted)

    return () => {
      window.removeEventListener("offline:sync-completed", handleSyncCompleted)
    }
  }, [wrapper])

  if (!wrapper) {
    return originalStore
  }

  return {
    ...originalStore,
    createTask: wrapper.createTaskOffline.bind(wrapper),
    updateTask: wrapper.updateTaskOffline.bind(wrapper),
    updateTaskStatus: wrapper.updateTaskStatusOffline.bind(wrapper),
    deleteTask: wrapper.deleteTaskOffline.bind(wrapper),
    syncTasks: wrapper.syncTasks.bind(wrapper),
    getTaskSyncStatus: wrapper.getTaskSyncStatus.bind(wrapper),
    getPendingTasksCount: wrapper.getPendingTasksCount.bind(wrapper),
    tasks: originalStore.tasks,
    loading: false,
    error: null,
  }
}
