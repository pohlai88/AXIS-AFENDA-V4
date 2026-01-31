import { z } from "zod"

/**
 * MagicToDo Task & Project Contracts
 *
 * Used by route handlers and client to validate requests/responses.
 * DB zod schemas are in lib/server/db/zod; these are API contracts.
 */

// ============ Priority ============
export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const

export const TaskPriority = z.enum([
  TASK_PRIORITY.LOW,
  TASK_PRIORITY.MEDIUM,
  TASK_PRIORITY.HIGH,
  TASK_PRIORITY.URGENT,
])
export type TaskPriority = z.infer<typeof TaskPriority>

// ============ Task Status ============
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELLED: "cancelled",
} as const

export const TaskStatus = z.enum([
  TASK_STATUS.TODO,
  TASK_STATUS.IN_PROGRESS,
  TASK_STATUS.DONE,
  TASK_STATUS.CANCELLED,
])
export type TaskStatus = z.infer<typeof TaskStatus>

// ============ Recurrence Rules ============
export const RECURRENCE_FREQUENCY = {
  DAILY: "daily",
  WEEKLY: "weekly",
  BIWEEKLY: "biweekly",
  MONTHLY: "monthly",
  YEARLY: "yearly",
} as const

export const RecurrenceFrequency = z.enum([
  RECURRENCE_FREQUENCY.DAILY,
  RECURRENCE_FREQUENCY.WEEKLY,
  RECURRENCE_FREQUENCY.BIWEEKLY,
  RECURRENCE_FREQUENCY.MONTHLY,
  RECURRENCE_FREQUENCY.YEARLY,
])
export type RecurrenceFrequency = z.infer<typeof RecurrenceFrequency>

export const recurrenceRuleSchema = z.object({
  frequency: RecurrenceFrequency,
  interval: z.number().int().min(1).default(1).describe("e.g., every N days/weeks"),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().describe("0=Sun, 6=Sat; for weekly/biweekly"),
  daysOfMonth: z.array(z.number().min(1).max(31)).optional().describe("For monthly rules"),
  endDate: z.string().datetime().optional().describe("Recurrence stops after this date"),
  maxOccurrences: z.number().int().min(1).optional().describe("Recurrence stops after N occurrences"),
})

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>

// ============ Task History Actions ============
export const TASK_HISTORY_ACTION = {
  /** User manually created task */
  CREATED: "created",
  /** User edited task */
  UPDATED: "updated",
  /** User marked done/undone */
  COMPLETED: "completed",
  /** User deleted task */
  DELETED: "deleted",
  /** Scheduler generated recurrence occurrence */
  AUTO_GENERATED: "auto_generated",
  /** Scheduler auto-cancelled overdue task */
  AUTO_CANCELLED_OVERDUE: "auto_cancelled_overdue",
} as const

export const TaskHistoryAction = z.enum([
  TASK_HISTORY_ACTION.CREATED,
  TASK_HISTORY_ACTION.UPDATED,
  TASK_HISTORY_ACTION.COMPLETED,
  TASK_HISTORY_ACTION.DELETED,
  TASK_HISTORY_ACTION.AUTO_GENERATED,
  TASK_HISTORY_ACTION.AUTO_CANCELLED_OVERDUE,
])
export type TaskHistoryAction = z.infer<typeof TaskHistoryAction>

// ============ Task Base (shared fields) ============
const taskBaseSchema = z.object({
  title: z.string().min(1).max(255).describe("Task title"),
  description: z.string().max(5000).optional().describe("Markdown description"),
  dueDate: z.string().datetime().optional().describe("ISO 8601 date + time"),
  priority: TaskPriority.default(TASK_PRIORITY.MEDIUM),
  status: TaskStatus.default(TASK_STATUS.TODO),
  projectId: z.string().optional().describe("Associated project"),
  tags: z.array(z.string().max(50)).optional().default([]).describe("User-defined tags"),
  recurrence: recurrenceRuleSchema.optional().describe("Recurrence rule if repeating"),
  parentTaskId: z.string().optional().describe("For sub-tasks (future)"),
})

// ============ Task Request (creation + update) ============
export const createTaskRequestSchema = taskBaseSchema.extend({
  // For quick-add natural language parsing (optional):
  nlText: z.string().optional().describe("Natural language: 'tomorrow 9am call with Bob'"),
})

export const updateTaskRequestSchema = taskBaseSchema.partial()

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>
export type UpdateTaskRequest = z.infer<typeof updateTaskRequestSchema>

// ============ Task Response (from API) ============
export const taskResponseSchema = taskBaseSchema.extend({
  id: z.string().describe("Task ID (UUID)"),
  userId: z.string().describe("Owner user ID"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional().describe("When marked done"),
  nextOccurrenceDate: z.string().datetime().optional().describe("For recurring tasks, next due"),
})

export type TaskResponse = z.infer<typeof taskResponseSchema>

// ============ Project Contracts ============
const projectBaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  color: z.string().optional().describe("Hex color for UI"),
  archived: z.boolean().default(false),
})

export const createProjectRequestSchema = projectBaseSchema

export const updateProjectRequestSchema = projectBaseSchema.partial()

export const projectResponseSchema = projectBaseSchema.extend({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  taskCount: z.number().optional().describe("Number of tasks in project"),
})

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>
export type ProjectResponse = z.infer<typeof projectResponseSchema>

// ============ List Responses ============
export const taskListResponseSchema = z.object({
  items: z.array(taskResponseSchema),
  total: z.number().describe("Total count for pagination"),
  limit: z.number().describe("Items per page"),
  offset: z.number().describe("Pagination offset"),
})

export type TaskListResponse = z.infer<typeof taskListResponseSchema>

// ============ Quick-Add NL Parser Result ============
export const nlParseResultSchema = z.object({
  title: z.string(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPriority.optional(),
  tags: z.array(z.string()).optional(),
})

export type NlParseResult = z.infer<typeof nlParseResultSchema>
