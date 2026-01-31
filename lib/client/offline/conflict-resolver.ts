"use client"

/**
 * Conflict resolution for offline synchronization
 * Handles detecting, resolving, and managing sync conflicts
 */

import { CONFLICT_STRATEGY, OFFLINE_EVENTS } from "@/lib/constants"
import { conflictStorage, taskStorage, projectStorage } from "./storage"
import type { SyncConflict, OfflineTask, OfflineProject } from "./storage"

export interface ConflictResolution {
  strategy: keyof typeof CONFLICT_STRATEGY
  resolvedData?: OfflineTask | OfflineProject | Record<string, unknown>
  requiresUserInput?: boolean
}

export class ConflictResolver {
  /**
   * Detect and resolve conflicts between client and server data
   */
  async resolveConflict(
    entityType: "task" | "project",
    clientData: OfflineTask | OfflineProject,
    serverData: OfflineTask | OfflineProject | null
  ): Promise<ConflictResolution> {
    // If server version is newer, check for conflicts
    if (serverData && serverData.syncVersion > clientData.syncVersion) {
      const conflictType = this.detectConflictType(clientData, serverData)

      switch (conflictType) {
        case "concurrent_modification":
          return this.resolveConcurrentModification(clientData, serverData)

        case "delete_conflict":
          return this.resolveDeleteConflict(clientData, serverData)

        case "field_conflict":
          return this.resolveFieldConflict(clientData, serverData)

        default:
          return { strategy: "MANUAL" as const, requiresUserInput: true }
      }
    }

    // No conflict, client wins
    return { strategy: "CLIENT_WINS" as const }
  }

  /**
   * Detect the type of conflict
   */
  private detectConflictType(
    clientData: OfflineTask | OfflineProject,
    serverData: OfflineTask | OfflineProject | null
  ): string {
    if (!serverData) return "delete_conflict"

    // Check if both sides modified the same fields
    const clientModifiedFields = this.getModifiedFields(clientData)
    const serverModifiedFields = this.getModifiedFields(serverData)
    const commonFields = clientModifiedFields.filter(field =>
      serverModifiedFields.includes(field)
    )

    if (clientData.isDeleted || (serverData && serverData.isDeleted)) {
      return "delete_conflict"
    }

    if (commonFields.length > 0) {
      return "field_conflict"
    }

    return "concurrent_modification"
  }

  /**
   * Get list of modified fields (excluding sync fields)
   */
  private getModifiedFields(data: OfflineTask | OfflineProject | Record<string, unknown>): string[] {
    const syncFields = ["syncStatus", "syncVersion", "lastSyncedAt", "clientGeneratedId"]
    return Object.keys(data as Record<string, unknown>).filter(key => !syncFields.includes(key))
  }

  /**
   * Resolve concurrent modification conflicts
   */
  private resolveConcurrentModification(
    clientData: OfflineTask | OfflineProject,
    serverData: OfflineTask | OfflineProject
  ): ConflictResolution {
    // Different fields were modified, merge them
    const merged = { ...serverData } as OfflineTask | OfflineProject

    // Overwrite with client changes for non-conflicting fields
    const clientFields = this.getModifiedFields(clientData)
    const serverFields = this.getModifiedFields(serverData)

    clientFields.forEach(field => {
      if (!serverFields.includes(field)) {
        (merged as unknown as Record<string, unknown>)[field] = (clientData as unknown as Record<string, unknown>)[field]
      }
    })

    return {
      strategy: "MERGE" as const,
      resolvedData: merged,
    }
  }

  /**
   * Resolve delete conflicts
   */
  private resolveDeleteConflict(
    clientData: OfflineTask | OfflineProject,
    serverData: OfflineTask | OfflineProject
  ): ConflictResolution {
    // If server deleted it, server wins
    if (serverData.isDeleted) {
      return { strategy: "SERVER_WINS" as const }
    }

    // If client deleted it, client wins
    if (clientData.isDeleted) {
      return { strategy: "CLIENT_WINS" as const }
    }

    return { strategy: "MANUAL" as const, requiresUserInput: true }
  }

  /**
   * Resolve field-level conflicts
   */
  private resolveFieldConflict(
    clientData: OfflineTask | OfflineProject,
    serverData: OfflineTask | OfflineProject
  ): ConflictResolution {
    // Try smart merging for specific fields
    const resolved: OfflineTask | OfflineProject = { ...serverData }
    const conflicts: string[] = []

    // Handle different entity types
    if ("title" in clientData && "title" in serverData) {
      // Task-specific resolution
      this.resolveTaskFields(clientData as OfflineTask, serverData as OfflineTask, resolved as OfflineTask, conflicts)
    } else if ("name" in clientData && "name" in serverData) {
      // Project-specific resolution
      this.resolveProjectFields(clientData as OfflineProject, serverData as OfflineProject, resolved as OfflineProject, conflicts)
    }

    // If we have unresolved conflicts, require user input
    if (conflicts.length > 0) {
      return {
        strategy: "MANUAL" as const,
        requiresUserInput: true,
        resolvedData: {
          client: clientData,
          server: serverData,
          conflicts,
        },
      }
    }

    return {
      strategy: "MERGE" as const,
      resolvedData: resolved,
    }
  }

  /**
   * Resolve task-specific field conflicts
   */
  private resolveTaskFields(
    clientTask: OfflineTask,
    serverTask: OfflineTask,
    resolved: OfflineTask,
    conflicts: string[]
  ): void {
    // Title: most recent edit wins
    if (clientTask.title !== serverTask.title) {
      resolved.title = clientTask.updatedAt > serverTask.updatedAt
        ? clientTask.title
        : serverTask.title
      if (clientTask.updatedAt === serverTask.updatedAt) {
        conflicts.push("title")
      }
    }

    // Description: concatenate if both added content
    if (clientTask.description !== serverTask.description) {
      if (clientTask.description && serverTask.description) {
        resolved.description = `${serverTask.description}\n\n[Added offline]: ${clientTask.description}`
      } else {
        resolved.description = clientTask.description || serverTask.description
      }
    }

    // Status: use client status if it's a completion
    if (clientTask.status !== serverTask.status) {
      if (clientTask.status === "done" && serverTask.status !== "done") {
        resolved.status = "done"
      } else if (serverTask.status === "done" && clientTask.status !== "done") {
        resolved.status = "done"
      } else {
        conflicts.push("status")
      }
    }

    // Priority: higher priority wins
    if (clientTask.priority !== serverTask.priority) {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const clientPriority = priorityOrder[clientTask.priority as keyof typeof priorityOrder] || 0
      const serverPriority = priorityOrder[serverTask.priority as keyof typeof priorityOrder] || 0

      resolved.priority = clientPriority >= serverPriority ? clientTask.priority : serverTask.priority
    }

    // Due date: earlier date wins
    if (clientTask.dueDate !== serverTask.dueDate) {
      if (clientTask.dueDate && serverTask.dueDate) {
        resolved.dueDate = new Date(clientTask.dueDate) < new Date(serverTask.dueDate)
          ? clientTask.dueDate
          : serverTask.dueDate
      } else {
        resolved.dueDate = clientTask.dueDate || serverTask.dueDate
      }
    }

    // Tags: merge arrays if they exist
    const clientTags = (clientTask as unknown as Record<string, unknown>).tags
    const serverTags = (serverTask as unknown as Record<string, unknown>).tags
    if (Array.isArray(clientTags) || Array.isArray(serverTags)) {
      const allTags = new Set([...(Array.isArray(serverTags) ? serverTags : []), ...(Array.isArray(clientTags) ? clientTags : [])])
        ; (resolved as unknown as Record<string, unknown>).tags = Array.from(allTags)
    }
  }

  /**
   * Resolve project-specific field conflicts
   */
  private resolveProjectFields(
    clientProject: OfflineProject,
    serverProject: OfflineProject,
    resolved: OfflineProject,
    conflicts: string[]
  ): void {
    // Name: most recent edit wins
    if (clientProject.name !== serverProject.name) {
      resolved.name = clientProject.updatedAt > serverProject.updatedAt
        ? clientProject.name
        : serverProject.name
      if (clientProject.updatedAt === serverProject.updatedAt) {
        conflicts.push("name")
      }
    }

    // Description: concatenate if both added content
    if (clientProject.description !== serverProject.description) {
      if (clientProject.description && serverProject.description) {
        resolved.description = `${serverProject.description}\n\n[Added offline]: ${clientProject.description}`
      } else {
        resolved.description = clientProject.description || serverProject.description
      }
    }

    // Color: client wins (personal preference)
    if (clientProject.color !== serverProject.color) {
      resolved.color = clientProject.color || serverProject.color
    }

    // Archived: if either archived, keep archived
    if (clientProject.archived !== serverProject.archived) {
      resolved.archived = clientProject.archived || serverProject.archived
    }
  }

  /**
   * Apply a resolution strategy
   */
  async applyResolution(
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    const conflict = await conflictStorage.getUnresolved("").then(c =>
      c.find(c => c.id === conflictId)
    )

    if (!conflict) {
      throw new Error("Conflict not found")
    }

    let resolvedData: OfflineTask | OfflineProject | Record<string, unknown> | null = null

    switch (resolution.strategy) {
      case "SERVER_WINS":
        resolvedData = conflict.serverData as OfflineTask | OfflineProject | Record<string, unknown> | null
        break

      case "CLIENT_WINS":
        resolvedData = conflict.clientData as OfflineTask | OfflineProject | Record<string, unknown>
        break

      case "MERGE":
        resolvedData = resolution.resolvedData ?? null
        break

      case "MANUAL":
        if (!resolution.resolvedData) {
          throw new Error("Manual resolution requires resolved data")
        }
        resolvedData = resolution.resolvedData
        break

      default:
        throw new Error(`Unknown resolution strategy: ${resolution.strategy}`)
    }

    // Update local storage with resolved data
    if (resolvedData && typeof resolvedData === "object" && "syncVersion" in resolvedData) {
      const syncVersion = typeof resolvedData.syncVersion === "number" ? resolvedData.syncVersion : 0
      if (conflict.entityType === "task") {
        await taskStorage.upsert({
          ...resolvedData,
          syncStatus: "pending" as const,
          syncVersion: syncVersion + 1,
        } as OfflineTask)
      } else {
        await projectStorage.upsert({
          ...resolvedData,
          syncStatus: "pending" as const,
          syncVersion: syncVersion + 1,
        } as OfflineProject)
      }
    }

    // Mark conflict as resolved
    await conflictStorage.markResolved(conflictId, resolution.strategy, resolvedData)

    // Emit event
    this.dispatchEvent(OFFLINE_EVENTS.CONFLICT_RESOLVED, {
      conflictId,
      entityType: conflict.entityType,
      strategy: resolution.strategy,
    })
  }

  /**
   * Get all unresolved conflicts for a user
   */
  async getUnresolvedConflicts(userId: string): Promise<SyncConflict[]> {
    return await conflictStorage.getUnresolved(userId)
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
export const conflictResolver = new ConflictResolver()
