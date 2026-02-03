import "@/lib/server/only"

import { and, desc, eq, isNull } from "drizzle-orm"

import { getDb, type Db } from "../client"
import { projects, tasks } from "../schema"
import type { CreateProjectRequest, UpdateProjectRequest } from "@/lib/contracts/tasks"

/**
 * Create a new project for a user
 */
export async function createProject(
  userId: string,
  projectData: CreateProjectRequest,
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const [project] = await dbx
    .insert(projects)
    .values({
      userId,
      organizationId: organizationId ?? null,
      teamId: teamId ?? null,
      ...projectData,
    })
    .returning()

  return project
}

/**
 * Get all projects for a user (excluding archived)
 */
export async function listProjects(userId: string, organizationId?: string | null, teamId?: string | null, db?: Db) {
  const dbx = db ?? getDb()
  const orgCond =
    organizationId === undefined
      ? undefined
      : organizationId === null
        ? isNull(projects.organizationId)
        : eq(projects.organizationId, organizationId)
  const teamCond =
    teamId === undefined ? undefined : teamId === null ? isNull(projects.teamId) : eq(projects.teamId, teamId)

  return await dbx
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      archived: projects.archived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: dbx
        .select({ count: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.projectId, projects.id), eq(tasks.userId, userId)))
        .as("taskCount"),
    })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.archived, false), orgCond, teamCond))
    .orderBy(desc(projects.updatedAt))
}

/**
 * Get all projects for a user (including archived)
 */
export async function listAllProjects(
  userId: string,
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const orgCond =
    organizationId === undefined
      ? undefined
      : organizationId === null
        ? isNull(projects.organizationId)
        : eq(projects.organizationId, organizationId)
  const teamCond =
    teamId === undefined ? undefined : teamId === null ? isNull(projects.teamId) : eq(projects.teamId, teamId)

  return await dbx
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      archived: projects.archived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: dbx
        .select({ count: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.projectId, projects.id), eq(tasks.userId, userId)))
        .as("taskCount"),
    })
    .from(projects)
    .where(and(eq(projects.userId, userId), orgCond, teamCond))
    .orderBy(desc(projects.updatedAt))
}

/**
 * Get a single project by ID
 */
export async function getProject(
  userId: string,
  projectId: string,
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const orgCond =
    organizationId === undefined
      ? undefined
      : organizationId === null
        ? isNull(projects.organizationId)
        : eq(projects.organizationId, organizationId)
  const teamCond =
    teamId === undefined ? undefined : teamId === null ? isNull(projects.teamId) : eq(projects.teamId, teamId)

  const [project] = await dbx
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      archived: projects.archived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: dbx
        .select({ count: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.projectId, projects.id), eq(tasks.userId, userId)))
        .as("taskCount"),
    })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId), orgCond, teamCond))

  return project
}

/**
 * Update a project
 */
export async function updateProject(
  userId: string,
  projectId: string,
  updates: UpdateProjectRequest,
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const orgCond =
    organizationId === undefined
      ? undefined
      : organizationId === null
        ? isNull(projects.organizationId)
        : eq(projects.organizationId, organizationId)
  const teamCond =
    teamId === undefined ? undefined : teamId === null ? isNull(projects.teamId) : eq(projects.teamId, teamId)

  const [project] = await dbx
    .update(projects)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId), orgCond, teamCond))
    .returning()

  return project
}

/**
 * Archive a project (soft delete)
 */
export async function archiveProject(userId: string, projectId: string) {
  const dbx = getDb()
  const [project] = await dbx
    .update(projects)
    .set({ archived: true, updatedAt: new Date() })
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
    .returning()

  return project
}

/**
 * Unarchive a project
 */
export async function unarchiveProject(userId: string, projectId: string) {
  const dbx = getDb()
  const [project] = await dbx
    .update(projects)
    .set({ archived: false, updatedAt: new Date() })
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
    .returning()

  return project
}

/**
 * Delete a project permanently
 */
export async function deleteProject(userId: string, projectId: string, db?: Db) {
  const dbx = db ?? getDb()
  const [project] = await dbx
    .delete(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
    .returning()

  return project
}

/**
 * Delete a project permanently (scoped)
 */
export async function deleteProjectScoped(
  userId: string,
  projectId: string,
  organizationId?: string | null,
  teamId?: string | null,
  db?: Db
) {
  const dbx = db ?? getDb()
  const orgCond =
    organizationId === undefined
      ? undefined
      : organizationId === null
        ? isNull(projects.organizationId)
        : eq(projects.organizationId, organizationId)
  const teamCond =
    teamId === undefined ? undefined : teamId === null ? isNull(projects.teamId) : eq(projects.teamId, teamId)

  const [project] = await dbx
    .delete(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId), orgCond, teamCond))
    .returning()

  return project
}

/**
 * Get tasks in a project
 */
export async function getProjectTasks(userId: string, projectId: string) {
  const db = getDb()
  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.projectId, projectId)))
    .orderBy(desc(tasks.createdAt))
}

export async function getProjectTasksScoped(
  userId: string,
  projectId: string,
  organizationId?: string | null,
  teamId?: string | null
) {
  const db = getDb()
  const orgCond =
    organizationId === undefined
      ? undefined
      : organizationId === null
        ? isNull(tasks.organizationId)
        : eq(tasks.organizationId, organizationId)
  const teamCond = teamId === undefined ? undefined : teamId === null ? isNull(tasks.teamId) : eq(tasks.teamId, teamId)
  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.projectId, projectId), orgCond, teamCond))
    .orderBy(desc(tasks.createdAt))
}

/**
 * Get tasks without a project (unassigned)
 */
export async function getUnassignedTasks(userId: string) {
  const db = getDb()
  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.projectId)))
    .orderBy(desc(tasks.createdAt))
}

export async function getUnassignedTasksScoped(
  userId: string,
  organizationId?: string | null,
  teamId?: string | null
) {
  const db = getDb()
  const orgCond =
    organizationId === undefined
      ? undefined
      : organizationId === null
        ? isNull(tasks.organizationId)
        : eq(tasks.organizationId, organizationId)
  const teamCond = teamId === undefined ? undefined : teamId === null ? isNull(tasks.teamId) : eq(tasks.teamId, teamId)

  return await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), isNull(tasks.projectId), orgCond, teamCond))
    .orderBy(desc(tasks.createdAt))
}
