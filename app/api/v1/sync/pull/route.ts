/**
 * Sync pull endpoint - fetches server changes since last sync
 * GET /api/v1/sync/pull?since=<timestamp>
 */

import { NextRequest, NextResponse } from "next/server"
import { parseSearchParams } from "@/lib/server/api/validate"
import { z } from "zod"
import { ok, fail } from "@/lib/server/api/response"
import { db, withTransaction } from "@/lib/server/db"
import { tasks, projects } from "@/lib/server/db/schema"
import { eq, and, gt, desc } from "drizzle-orm"
import { logger } from "@/lib/server/logger"
import { HEADER_NAMES } from "@/lib/constants"

const querySchema = z.object({
  since: z.string().optional().transform(val => val ? new Date(val) : undefined),
})

export async function GET(req: NextRequest) {
  const requestId = req.headers.get(HEADER_NAMES.REQUEST_ID) || "unknown"
  const userId = req.headers.get("x-user-id")

  if (!userId) {
    logger.warn({ message: "Sync pull attempt without user ID", requestId })
    return fail({ code: "UNAUTHORIZED", message: "User ID required", requestId }, 401)
  }

  try {
    const { since } = parseSearchParams(req.nextUrl.searchParams, querySchema)

    logger.info({ message: "Processing sync pull", userId, since, requestId })

    // Build base conditions
    const taskCondition = since
      ? gt(tasks.updatedAt, since)
      : undefined

    const projectCondition = since
      ? gt(projects.updatedAt, since)
      : undefined

    // Fetch updated tasks
    const updatedTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          taskCondition
        )
      )
      .orderBy(desc(tasks.updatedAt))

    // Fetch updated projects
    const updatedProjects = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          projectCondition,
          eq(projects.archived, false) // Don't send archived items in pull
        )
      )
      .orderBy(desc(projects.updatedAt))

    // Also check for any deleted items since last sync
    // Note: tasks don't have a deleted flag, so we return empty array
    const deletedTasks: { id: string; clientGeneratedId: string | null; deletedAt: Date }[] = []

    const deletedProjects = since ? await db
      .select({
        id: projects.id,
        clientGeneratedId: projects.clientGeneratedId,
        deletedAt: projects.updatedAt,
      })
      .from(projects)
      .where(
        and(
          eq(projects.userId, userId),
          gt(projects.updatedAt, since),
          eq(projects.archived, true) // Using archived as soft delete for projects
        )
      ) : Promise.resolve([])

    const deletedTasksArray = deletedTasks
    const deletedProjectsArray = Array.isArray(deletedProjects) ? deletedProjects : await deletedProjects

    logger.info({
      message: "Sync pull completed",
      userId,
      tasksCount: updatedTasks.length,
      projectsCount: updatedProjects.length,
      deletedTasksCount: deletedTasksArray.length,
      deletedProjectsCount: deletedProjectsArray.length,
      requestId,
    })

    return ok({
      tasks: updatedTasks,
      projects: updatedProjects,
      deleted: {
        tasks: deletedTasksArray,
        projects: deletedProjectsArray,
      },
      lastSync: new Date().toISOString(),
    })

  } catch (error) {
    logger.error({
      message: "Sync pull failed",
      userId,
      error: error instanceof Error ? error.message : "Unknown error",
      requestId,
    })

    return fail({ code: "INTERNAL_ERROR", message: "Sync pull failed", requestId }, 500)
  }
}
