import "@/lib/server/only"

import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { userProfiles, tasks, projects } from "./schema"

// Base schemas (auto-generated)
// NOTE: Neon Auth owns auth users; this is app-owned profile/preferences.
export const UserProfileSelectSchema = createSelectSchema(userProfiles)
export const UserProfileInsertSchema = createInsertSchema(userProfiles)

export const TaskSelectSchema = createSelectSchema(tasks)
export const TaskInsertSchema = createInsertSchema(tasks)

export const ProjectSelectSchema = createSelectSchema(projects)
export const ProjectInsertSchema = createInsertSchema(projects)

// Refined schemas for specific use cases
export const TaskCreateSchema = TaskInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    userId: true, // Added from auth context
    organizationId: true, // Added from tenant context (if applicable)
    teamId: true, // Added from tenant context (if applicable)
}).extend({
    // Add custom validations
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    status: z.enum(["todo", "in_progress", "done", "cancelled"]).default("todo"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    dueDate: z.date().optional(),
    projectId: z.string().optional(),
})

export const TaskUpdateSchema = TaskInsertSchema.pick({
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    projectId: true,
}).partial()

export const ProjectCreateSchema = ProjectInsertSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    userId: true, // Added from auth context
    organizationId: true, // Added from tenant context (if applicable)
    teamId: true, // Added from tenant context (if applicable)
}).extend({
    name: z.string().min(1).max(255),
    description: z.string().optional(),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

export const ProjectUpdateSchema = ProjectInsertSchema.pick({
    name: true,
    description: true,
    color: true,
    archived: true,
}).partial()

// Export types
export type UserProfile = typeof userProfiles.$inferSelect
export type NewUserProfile = typeof userProfiles.$inferInsert

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type TaskCreate = z.infer<typeof TaskCreateSchema>
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>

