"use client"

/**
 * Type guards and utility functions for offline sync types
 */

import type { Task, Project, TaskCreate, TaskUpdate, ProjectCreate, ProjectUpdate } from "@/lib/contracts/tasks"
import type { OfflineTask, OfflineProject } from "./storage"

// ============ Type Guards ============

export function isOfflineTask(data: unknown): data is OfflineTask {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "title" in data &&
    "syncStatus" in data &&
    "syncVersion" in data
  )
}

export function isOfflineProject(data: unknown): data is OfflineProject {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    "name" in data &&
    "syncStatus" in data &&
    "syncVersion" in data
  )
}

export function hasId(data: unknown): data is { id: string } {
  return typeof data === "object" && data !== null && "id" in data && typeof (data as { id: unknown }).id === "string"
}

export function hasSyncVersion(data: unknown): data is { syncVersion: number } {
  return (
    typeof data === "object" &&
    data !== null &&
    "syncVersion" in data &&
    typeof (data as { syncVersion: unknown }).syncVersion === "number"
  )
}

export function hasTitle(data: unknown): data is { title: string } {
  return typeof data === "object" && data !== null && "title" in data && typeof (data as { title: unknown }).title === "string"
}

export function hasName(data: unknown): data is { name: string } {
  return typeof data === "object" && data !== null && "name" in data && typeof (data as { name: unknown }).name === "string"
}

// ============ Type Converters ============

/**
 * Convert OfflineTask to Task (remove sync fields)
 */
export function offlineTaskToTask(offlineTask: OfflineTask): Task {
  const { syncStatus: _syncStatus, syncVersion: _syncVersion, lastSyncedAt: _lastSyncedAt, clientGeneratedId: _clientGeneratedId, ...task } = offlineTask
  return task as Task
}

/**
 * Convert OfflineProject to Project (remove sync fields)
 */
export function offlineProjectToProject(offlineProject: OfflineProject): Project {
  const { syncStatus: _syncStatus, syncVersion: _syncVersion, lastSyncedAt: _lastSyncedAt, clientGeneratedId: _clientGeneratedId, ...project } = offlineProject
  return project as Project
}

/**
 * Convert Task to OfflineTask (add sync fields)
 */
export function taskToOfflineTask(task: Task, syncFields: {
  syncStatus: OfflineTask["syncStatus"]
  syncVersion: number
  clientGeneratedId: string
  lastSyncedAt?: Date
}): OfflineTask {
  return {
    ...task,
    ...syncFields,
  }
}

/**
 * Convert Project to OfflineProject (add sync fields)
 */
export function projectToOfflineProject(project: Project, syncFields: {
  syncStatus: OfflineProject["syncStatus"]
  syncVersion: number
  clientGeneratedId: string
  lastSyncedAt?: Date
}): OfflineProject {
  return {
    ...project,
    ...syncFields,
  }
}

// ============ Data Type Discriminators ============

export function isTaskData(
  data: TaskCreate | TaskUpdate | ProjectCreate | ProjectUpdate | Record<string, unknown>
): data is TaskCreate | TaskUpdate {
  return hasTitle(data)
}

export function isProjectData(
  data: TaskCreate | TaskUpdate | ProjectCreate | ProjectUpdate | Record<string, unknown>
): data is ProjectCreate | ProjectUpdate {
  return hasName(data)
}

export function isCreateOperation(
  data: TaskCreate | TaskUpdate | ProjectCreate | ProjectUpdate | Record<string, unknown>
): data is TaskCreate | ProjectCreate {
  return !hasId(data)
}

export function isUpdateOperation(
  data: TaskCreate | TaskUpdate | ProjectCreate | ProjectUpdate | Record<string, unknown>
): data is TaskUpdate | ProjectUpdate {
  return hasId(data)
}

// ============ Safe Property Access ============

export function safeGetId(data: unknown): string | undefined {
  return hasId(data) ? data.id : undefined
}

export function safeGetSyncVersion(data: unknown): number | undefined {
  return hasSyncVersion(data) ? data.syncVersion : undefined
}

export function safeGetTitle(data: unknown): string | undefined {
  return hasTitle(data) ? data.title : undefined
}

export function safeGetName(data: unknown): string | undefined {
  return hasName(data) ? data.name : undefined
}

// ============ Validation Helpers ============

export function validateOfflineTask(data: unknown): OfflineTask {
  if (!isOfflineTask(data)) {
    throw new Error("Invalid offline task data")
  }
  return data
}

export function validateOfflineProject(data: unknown): OfflineProject {
  if (!isOfflineProject(data)) {
    throw new Error("Invalid offline project data")
  }
  return data
}
