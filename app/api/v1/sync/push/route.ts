/**
 * Sync push endpoint - receives client changes and applies them to server
 * POST /api/v1/sync/push
 */

import { NextRequest } from "next/server"
import { parseJson } from "@/lib/server/api/validate"
import { z } from "zod"
import { ok, fail } from "@/lib/server/api/response"
import { withTransaction } from "@/lib/server/db"
import { tasks, projects } from "@/lib/server/db/schema"
import { eq, and } from "drizzle-orm"
import { logger } from "@/lib/server/logger"
import { HEADER_NAMES, SYNC_STATUS, SYNC_OPERATION } from "@/lib/constants"
import { nanoid } from "nanoid"

const pushSchema = z.object({
  operations: z.array(z.object({
    entityType: z.enum(["task", "project"]),
    operation: z.enum(["create", "update", "delete"]),
    data: z.record(z.string(), z.unknown()),
    clientGeneratedId: z.string().optional(),
    clientVersion: z.number(),
  })),
})

export async function POST(req: NextRequest) {
  const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) || "unknown"
  const userId = req.headers.get("x-user-id")

  if (!userId) {
    logger.warn({ message: "Sync push attempt without user ID", requestId })
    return fail({ code: "UNAUTHORIZED", message: "User ID required", requestId }, 401)
  }

  try {
    const body = await parseJson(req, pushSchema)
    const { operations } = body as { operations: Array<{ entityType: string; operation: string; data: Record<string, unknown>; clientGeneratedId?: string; clientVersion: number }> }

    logger.info({ message: "Processing sync push", userId, operationCount: operations.length, requestId })

    const results = await withTransaction(async (tx) => {
      const processed: Record<string, unknown>[] = []
      const conflicts: { type: string; entityType: string; entityId: unknown; reason: string }[] = []

      for (const operation of operations) {
        try {
          const result = await processOperation(tx, operation, userId)
          processed.push(result)
        } catch (error) {
          conflicts.push({
            type: "error",
            entityType: operation.entityType,
            entityId: (operation.data as any).id,
            reason: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      return { processed, conflicts }
    })

    if (results && typeof results === 'object' && 'processed' in results) {
      const resultData = results as unknown as { processed: unknown[], conflicts: unknown[] }
      logger.info({
        message: "Sync push completed",
        userId,
        processedCount: resultData.processed.length,
        conflictCount: resultData.conflicts.length,
        requestId,
      })

      return ok({
        processed: resultData.processed,
        conflicts: resultData.conflicts,
        timestamp: new Date().toISOString(),
      })
    } else {
      throw new Error("Transaction failed")
    }

  } catch (error) {
    logger.error({
      message: "Sync push failed",
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      requestId,
    })

    return fail({ code: "INTERNAL_ERROR", message: "Sync push failed", requestId }, 500)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionType = any

 
async function processOperation(
  tx: TransactionType,
  operation: {
    entityType: string
    operation: string
    data: Record<string, unknown>
    clientGeneratedId?: string
    clientVersion: number
  },
  userId: string
): Promise<Record<string, unknown>> {
  const { entityType, operation: op, data, clientGeneratedId, clientVersion } = operation

  if (entityType === "task") {
    return await processTaskOperation(tx, op, data, userId, clientGeneratedId, clientVersion)
  } else if (entityType === "project") {
    return await processProjectOperation(tx, op, data, userId, clientGeneratedId, clientVersion)
  }

  throw new Error(`Unknown entity type: ${entityType}`)
}

 
async function processTaskOperation(
  tx: TransactionType,
  operation: string,
  data: Record<string, unknown>,
  userId: string,
  clientGeneratedId?: string,
  clientVersion?: number
): Promise<Record<string, unknown>> {
  switch (operation) {
    case SYNC_OPERATION.CREATE:
      // Check if task already exists (might have been created by another client)
      const existingByClientId = clientGeneratedId ? await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.clientGeneratedId, clientGeneratedId)
        ))
        .limit(1) : []

      if (existingByClientId.length > 0) {
        throw new Error("Task already exists")
      }

      // Create new task
      const newTask = {
        id: nanoid(),
        userId,
        title: (data as any).title || "Untitled Task",
        description: (data as any).description || null,
        status: (data as any).status || "todo",
        priority: (data as any).priority || "medium",
        dueDate: (data as any).dueDate || null,
        projectId: (data as any).projectId || null,
        tags: (data as any).tags || [],
        completedAt: (data as any).completedAt || null,
        ...data,
        clientGeneratedId: clientGeneratedId || nanoid(),
        syncStatus: SYNC_STATUS.SYNCED,
        syncVersion: 1,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await tx.insert(tasks).values(newTask)
      return { type: "created", id: newTask.id, clientGeneratedId: newTask.clientGeneratedId }

    case SYNC_OPERATION.UPDATE:
      // Get existing task
      const existing = await tx
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.id, data.id as string),
          eq(tasks.userId, userId)
        ))
        .limit(1)

      if (existing.length === 0) {
        throw new Error("Task not found")
      }

      const task = existing[0]

      // Check for version conflicts
      if (task.syncVersion > clientVersion!) {
        throw new Error("conflict")
      }

      // Update task
      const updatedTask = {
        ...data,
        syncStatus: SYNC_STATUS.SYNCED,
        syncVersion: task.syncVersion + 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      }

      await tx
        .update(tasks)
        .set(updatedTask)
        .where(eq(tasks.id, data.id as string))

      return { type: "updated", id: data.id, version: updatedTask.syncVersion }

    case SYNC_OPERATION.DELETE:
      // Note: tasks don't have a deleted flag, so we'll just update the sync status
      await tx
        .update(tasks)
        .set({
          syncStatus: SYNC_STATUS.SYNCED,
          updatedAt: new Date(),
        })
        .where(and(
          eq(tasks.id, data.id as string),
          eq(tasks.userId, userId)
        ))

      return { type: "deleted", id: data.id as string }

    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}

async function processProjectOperation(
  tx: any,
  operation: string,
  data: Record<string, unknown>,
  userId: string,
  clientGeneratedId?: string,
  clientVersion?: number
): Promise<Record<string, unknown>> {
  switch (operation) {
    case SYNC_OPERATION.CREATE:
      // Check if project already exists
      const existingByClientId = clientGeneratedId ? await tx
        .select()
        .from(projects)
        .where(and(
          eq(projects.userId, userId),
          eq(projects.clientGeneratedId, clientGeneratedId)
        ))
        .limit(1) : []

      if (existingByClientId.length > 0) {
        throw new Error("Project already exists")
      }

      // Create new project
      const newProject = {
        id: nanoid(),
        userId,
        name: (data as any).name || "Untitled Project",
        description: (data as any).description || null,
        color: (data as any).color || "#3b82f6",
        archived: (data as any).archived || false,
        ...data,
        clientGeneratedId: clientGeneratedId || nanoid(),
        syncStatus: SYNC_STATUS.SYNCED,
        syncVersion: 1,
        lastSyncedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await tx.insert(projects).values(newProject)
      return { type: "created", id: newProject.id, clientGeneratedId: newProject.clientGeneratedId }

    case SYNC_OPERATION.UPDATE:
      // Get existing project
      const existing = await tx
        .select()
        .from(projects)
        .where(and(
          eq(projects.id, data.id as string),
          eq(projects.userId, userId)
        ))
        .limit(1)

      if (existing.length === 0) {
        throw new Error("Project not found")
      }

      const project = existing[0]

      // Check for version conflicts
      if (project.syncVersion > clientVersion!) {
        throw new Error("conflict")
      }

      // Update project
      const updatedProject = {
        ...data,
        syncStatus: SYNC_STATUS.SYNCED,
        syncVersion: project.syncVersion + 1,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      }

      await tx
        .update(projects)
        .set(updatedProject)
        .where(eq(projects.id, data.id as string))

      return { type: "updated", id: data.id as string, version: updatedProject.syncVersion }

    case SYNC_OPERATION.DELETE:
      // Archive project (soft delete)
      await tx
        .update(projects)
        .set({
          archived: true,
          syncStatus: SYNC_STATUS.SYNCED,
          updatedAt: new Date(),
        })
        .where(and(
          eq(projects.id, data.id as string),
          eq(projects.userId, userId)
        ))

      return { type: "deleted", id: data.id as string }

    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}
