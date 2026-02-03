import "@/lib/server/only"

import { eq, and, desc, isNull } from "drizzle-orm"
import { tasks, taskHistory } from "@/lib/server/db/schema"
import {
  TASK_HISTORY_ACTION,
  TASK_PRIORITY,
  TASK_STATUS,
  type TaskHistoryAction,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/contracts/tasks"
import { DB_LIMITS, PAGINATION } from "@/lib/constants"
import { getDb, type Db } from "@/lib/server/db/client"

/**
 * Task queries: all operations assume user_id is pre-validated.
 */

export async function createTask(
  userId: string,
  taskData: {
    title: string
    description?: string
    dueDate?: Date
    priority?: TaskPriority
    status?: TaskStatus
    projectId?: string
    tags?: string[]
  },
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const [task] = await dbx
    .insert(tasks)
    .values({
      userId,
      organizationId: organizationId ?? null,
      teamId: teamId ?? null,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      priority: taskData.priority || TASK_PRIORITY.MEDIUM,
      status: taskData.status || TASK_STATUS.TODO,
      projectId: taskData.projectId,
      tags: taskData.tags || [],
    })
    .returning()

  // Log in task history
  await logTaskHistory(
    userId,
    task.id,
    TASK_HISTORY_ACTION.CREATED,
    organizationId ?? null,
    teamId ?? null,
    undefined,
    dbx
  )

  return task
}

export async function updateTask(
  userId: string,
  taskId: string,
  updates: {
    title?: string
    description?: string
    dueDate?: Date | null
    priority?: TaskPriority
    status?: TaskStatus
    completedAt?: Date | null
    tags?: string[]
  },
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const [task] = await dbx
    .update(tasks)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.userId, userId),
        organizationId === undefined
          ? undefined
          : organizationId === null
            ? isNull(tasks.organizationId)
            : eq(tasks.organizationId, organizationId),
        teamId === undefined ? undefined : teamId === null ? isNull(tasks.teamId) : eq(tasks.teamId, teamId)
      )
    )
    .returning()

  if (task) {
    await logTaskHistory(userId, taskId, TASK_HISTORY_ACTION.UPDATED, organizationId ?? null, teamId ?? null, updates, dbx)
  }

  return task
}

export async function deleteTask(
  userId: string,
  taskId: string,
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const [task] = await dbx
    .delete(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.userId, userId),
        organizationId === undefined
          ? undefined
          : organizationId === null
            ? isNull(tasks.organizationId)
            : eq(tasks.organizationId, organizationId),
        teamId === undefined ? undefined : teamId === null ? isNull(tasks.teamId) : eq(tasks.teamId, teamId)
      )
    )
    .returning()

  if (task) {
    await logTaskHistory(userId, taskId, TASK_HISTORY_ACTION.DELETED, organizationId ?? null, teamId ?? null, undefined, dbx)
  }

  return task
}

export async function getTask(
  userId: string,
  taskId: string,
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const [task] = await dbx
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.userId, userId),
        organizationId === undefined
          ? undefined
          : organizationId === null
            ? isNull(tasks.organizationId)
            : eq(tasks.organizationId, organizationId),
        teamId === undefined ? undefined : teamId === null ? isNull(tasks.teamId) : eq(tasks.teamId, teamId)
      )
    )
  return task
}

export async function listTasks(
  userId: string,
  organizationId?: string | null,
  teamId?: string | null,
  filters?: {
    projectId?: string
    status?: TaskStatus
    priority?: TaskPriority
    dueBefore?: Date
    dueAfter?: Date
    archived?: boolean
  },
  pagination?: { limit?: number; offset?: number },
  db?: Db
) {
  const dbx = db ?? getDb()
  const limit = Math.min(
    pagination?.limit ?? PAGINATION.DEFAULT_PAGE_SIZE,
    DB_LIMITS.MAX_SELECT_ROWS
  )
  const offset = pagination?.offset ?? 0

  const conditions: Array<ReturnType<typeof eq>> = [eq(tasks.userId, userId)]

  if (organizationId !== undefined) {
    conditions.push(
      organizationId === null ? isNull(tasks.organizationId) : eq(tasks.organizationId, organizationId)
    )
  }
  if (teamId !== undefined) {
    conditions.push(teamId === null ? isNull(tasks.teamId) : eq(tasks.teamId, teamId))
  }

  if (filters?.projectId) conditions.push(eq(tasks.projectId, filters.projectId))
  if (filters?.status) conditions.push(eq(tasks.status, filters.status))
  if (filters?.priority) conditions.push(eq(tasks.priority, filters.priority))

  const taskList = await dbx
    .select()
    .from(tasks)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset)
    .orderBy(desc(tasks.dueDate))

  const [countResult] = await dbx
    .select({ count: tasks.id })
    .from(tasks)
    .where(and(...conditions))

  return {
    items: taskList,
    total: countResult?.count || 0,
    limit,
    offset,
  }
}

export async function completeTask(userId: string, taskId: string, db?: Db) {
  const dbx = db ?? getDb()
  return updateTask(userId, taskId, { status: TASK_STATUS.DONE, completedAt: new Date() }, undefined, undefined, dbx)
}

// ============ Helper: Task History ============
async function logTaskHistory(
  userId: string,
  taskId: string,
  action: TaskHistoryAction,
  organizationId: string | null,
  teamId: string | null,
  previousValues?: unknown,
  dbOverride?: Db
) {
  const db = dbOverride ?? getDb()
  await db.insert(taskHistory).values({
    taskId,
    userId,
    organizationId,
    teamId,
    action,
    previousValues: previousValues ? JSON.stringify(previousValues) : null,
  })
}
