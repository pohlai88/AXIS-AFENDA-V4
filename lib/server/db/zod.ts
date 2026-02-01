import "@/lib/server/only"

import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { z } from "zod"

import { users, tasks, projects } from "./schema"

// Base schemas (auto-generated)
export const UserSelectSchema = createSelectSchema(users)
export const UserInsertSchema = createInsertSchema(users)

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
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type TaskCreate = z.infer<typeof TaskCreateSchema>
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>

