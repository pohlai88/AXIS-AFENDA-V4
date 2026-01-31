import { and, desc, eq, isNull } from "drizzle-orm"

import { getDb } from "../client"
import { projects, tasks } from "../schema"
import type { CreateProjectRequest, UpdateProjectRequest } from "@/lib/contracts/tasks"

/**
 * Create a new project for a user
 */
export async function createProject(
  userId: string,
  projectData: CreateProjectRequest
) {
  const db = getDb()
  const [project] = await db
    .insert(projects)
    .values({
      userId,
      ...projectData,
    })
    .returning()

  return project
}

/**
 * Get all projects for a user (excluding archived)
 */
export async function listProjects(userId: string) {
  const db = getDb()
  return await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      archived: projects.archived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: db
        .select({ count: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.projectId, projects.id), eq(tasks.userId, userId)))
        .as("taskCount"),
    })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.archived, false)))
    .orderBy(desc(projects.updatedAt))
}

/**
 * Get all projects for a user (including archived)
 */
export async function listAllProjects(userId: string) {
  const db = getDb()
  return await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      archived: projects.archived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: db
        .select({ count: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.projectId, projects.id), eq(tasks.userId, userId)))
        .as("taskCount"),
    })
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(desc(projects.updatedAt))
}

/**
 * Get a single project by ID
 */
export async function getProject(userId: string, projectId: string) {
  const db = getDb()
  const [project] = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      color: projects.color,
      archived: projects.archived,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      taskCount: db
        .select({ count: tasks.id })
        .from(tasks)
        .where(and(eq(tasks.projectId, projects.id), eq(tasks.userId, userId)))
        .as("taskCount"),
    })
    .from(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))

  return project
}

/**
 * Update a project
 */
export async function updateProject(
  userId: string,
  projectId: string,
  updates: UpdateProjectRequest
) {
  const db = getDb()
  const [project] = await db
    .update(projects)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
    .returning()

  return project
}

/**
 * Archive a project (soft delete)
 */
export async function archiveProject(userId: string, projectId: string) {
  const db = getDb()
  const [project] = await db
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
  const db = getDb()
  const [project] = await db
    .update(projects)
    .set({ archived: false, updatedAt: new Date() })
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
    .returning()

  return project
}

/**
 * Delete a project permanently
 */
export async function deleteProject(userId: string, projectId: string) {
  const db = getDb()
  const [project] = await db
    .delete(projects)
    .where(and(eq(projects.userId, userId), eq(projects.id, projectId)))
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
