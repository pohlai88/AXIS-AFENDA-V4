import { z } from "zod"
import {
  TASK_FILTERING,
  PAGINATION
} from "@/lib/constants"

/**
 * MagicToDo Task & Project Contracts
 *
 * Used by route handlers and client to validate requests/responses.
 * These extend the database schemas with API-specific transformations.
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

// ============ Base Schemas ============
export const TaskBaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  status: TaskStatus,
  priority: TaskPriority,
  dueDate: z.date().nullable().optional(),
  projectId: z.string().nullable().optional(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  completedAt: z.date().nullable().optional(),
})

export const ProjectBaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).nullable().optional(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  archived: z.boolean().default(false),
})

// ============ Request Schemas ============
export const CreateTaskRequestSchema = TaskBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  completedAt: true,
}).extend({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: TaskStatus.default(TASK_STATUS.TODO),
  priority: TaskPriority.default(TASK_PRIORITY.MEDIUM),
  dueDate: z.date().optional(),
  projectId: z.string().optional(),
})

export const UpdateTaskRequestSchema = TaskBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  completedAt: true,
}).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  dueDate: true,
  projectId: true,
}).partial()

export const CreateProjectRequestSchema = ProjectBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  archived: true,
}).extend({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
})

export const UpdateProjectRequestSchema = ProjectBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
}).pick({
  name: true,
  description: true,
  color: true,
  archived: true,
}).partial()

// ============ Param Validation Schemas ============
export const taskParamsSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
})

export const projectParamsSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
})

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value)

export const taskQuerySchema = z.object({
  status: z.preprocess(emptyToUndefined, TaskStatus.optional()),
  priority: z.preprocess(emptyToUndefined, TaskPriority.optional()),
  projectId: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(100).default(50)
  ),
  offset: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(0).default(0)
  ),
})

export const projectQuerySchema = z.object({
  includeArchived: z.preprocess(
    (value) => (value === "true" ? true : value === "false" ? false : undefined),
    z.boolean().default(false)
  ),
})

// ============ Response Schemas ============
export const TaskResponseSchema = TaskBaseSchema

export const ProjectResponseSchema = ProjectBaseSchema

// ============ List Response Schemas ============
export const TaskListResponseSchema = z.object({
  tasks: z.array(TaskResponseSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(PAGINATION.MAX_PAGE_SIZE),
    total: z.number().min(0),
    totalPages: z.number().min(0),
  }),
})

export const ProjectListResponseSchema = z.object({
  projects: z.array(ProjectResponseSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(PAGINATION.MAX_PAGE_SIZE),
    total: z.number().min(0),
    totalPages: z.number().min(0),
  }),
})

// ============ Export Types ============
export type Task = z.infer<typeof TaskResponseSchema>
export type TaskCreate = z.infer<typeof CreateTaskRequestSchema>
export type TaskUpdate = z.infer<typeof UpdateTaskRequestSchema>

export type Project = z.infer<typeof ProjectResponseSchema>
export type ProjectCreate = z.infer<typeof CreateProjectRequestSchema>
export type ProjectUpdate = z.infer<typeof UpdateProjectRequestSchema>

export type TaskListResponse = z.infer<typeof TaskListResponseSchema>
export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>

// Legacy exports for backward compatibility
export type { TaskResponse as TaskResponseLegacy }

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

// ============ Param Types ============
export type TaskParams = z.infer<typeof taskParamsSchema>
export type ProjectParams = z.infer<typeof projectParamsSchema>

export type ProjectResponse = z.infer<typeof projectResponseSchema>

// ============ List Responses ============
export const taskListResponseSchema = z.object({
  items: z.array(taskResponseSchema),
  total: z.number().describe("Total count for pagination"),
  limit: z.number().describe("Items per page"),
  offset: z.number().describe("Pagination offset"),
})

// ============ Quick-Add NL Parser Result ============
export const nlParseResultSchema = z.object({
  title: z.string(),
  dueDate: z.string().datetime().optional(),
  priority: TaskPriority.optional(),
  tags: z.array(z.string()).optional(),
})

export type NlParseResult = z.infer<typeof nlParseResultSchema>

// ============ Advanced Filtering ============

// Date range filter
export const dateRangeFilterSchema = z.object({
  startDate: z.string().datetime().optional().describe("Start date (ISO 8601)"),
  endDate: z.string().datetime().optional().describe("End date (ISO 8601)"),
  relativeRange: z.enum([
    "today",
    "yesterday",
    "this_week",
    "last_week",
    "this_month",
    "last_month",
    "this_quarter",
    "last_quarter",
    "this_year",
    "last_year",
    "overdue",
    "due_today",
    "due_this_week",
    "due_this_month",
  ]).optional().describe("Predefined date ranges"),
})

export type DateRangeFilter = z.infer<typeof dateRangeFilterSchema>

// Search filter
export const searchFilterSchema = z.object({
  query: z.string().min(1).max(255).describe("Search query"),
  fields: z.array(z.enum(Object.values(TASK_FILTERING.SEARCH_FIELDS)))
    .default([TASK_FILTERING.SEARCH_FIELDS.ALL])
    .describe("Fields to search in"),
  matchType: z.enum(Object.values(TASK_FILTERING.SEARCH_MATCH_TYPES))
    .default(TASK_FILTERING.SEARCH_MATCH_TYPES.CONTAINS)
    .describe("Search matching type"),
})

export type SearchFilter = z.infer<typeof searchFilterSchema>

// Multi-select filter
export const multiSelectFilterSchema = z.object({
  values: z.array(z.string()).describe("Selected values"),
  includeMode: z.enum(Object.values(TASK_FILTERING.INCLUDE_MODES))
    .default(TASK_FILTERING.INCLUDE_MODES.ANY)
    .describe("How to combine multiple values"),
})

export type MultiSelectFilter = z.infer<typeof multiSelectFilterSchema>

// Advanced task filters
export const advancedTaskFiltersSchema = z.object({
  // Search
  search: searchFilterSchema.optional(),

  // Date ranges
  createdDate: dateRangeFilterSchema.optional(),
  dueDate: dateRangeFilterSchema.optional(),
  completedDate: dateRangeFilterSchema.optional(),

  // Multi-select filters
  status: multiSelectFilterSchema.optional(),
  priority: multiSelectFilterSchema.optional(),
  tags: multiSelectFilterSchema.optional(),
  projects: multiSelectFilterSchema.optional(),

  // Boolean filters
  hasDueDate: z.boolean().optional().describe("Filter tasks with/without due dates"),
  isOverdue: z.boolean().optional().describe("Filter overdue tasks"),
  hasRecurrence: z.boolean().optional().describe("Filter recurring tasks"),
  hasDescription: z.boolean().optional().describe("Filter tasks with descriptions"),
  hasTags: z.boolean().optional().describe("Filter tasks with tags"),

  // Numeric ranges
  estimatedDuration: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional(),
  }).optional().describe("Filter by estimated duration in hours"),

  // Sorting
  sortBy: z.enum(Object.values(TASK_FILTERING.SORT_OPTIONS))
    .default(TASK_FILTERING.DEFAULTS.SORT_BY)
    .describe("Field to sort by"),

  sortOrder: z.enum(Object.values(TASK_FILTERING.SORT_ORDER))
    .default(TASK_FILTERING.DEFAULTS.SORT_ORDER)
    .describe("Sort order"),
})

export type AdvancedTaskFilters = z.infer<typeof advancedTaskFiltersSchema>

// Filter request for API
export const taskFilterRequestSchema = z.object({
  filters: advancedTaskFiltersSchema.optional().default({
    sortBy: TASK_FILTERING.DEFAULTS.SORT_BY,
    sortOrder: TASK_FILTERING.DEFAULTS.SORT_ORDER,
  }),
  pagination: z.object({
    limit: z.number().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE),
    offset: z.number().min(0).default(PAGINATION.DEFAULT_PAGE),
  }).optional().default({
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
    offset: PAGINATION.DEFAULT_PAGE,
  }),
})

export type TaskFilterRequest = z.infer<typeof taskFilterRequestSchema>

// Filtered task response
export const filteredTaskListResponseSchema = taskListResponseSchema.extend({
  filters: advancedTaskFiltersSchema.optional().describe("Applied filters for reference"),
  facets: z.object({
    statusCounts: z.record(z.string(), z.number()),
    priorityCounts: z.record(z.string(), z.number()),
    projectCounts: z.record(z.string(), z.number()),
    tagCounts: z.record(z.string(), z.number()),
    totalCount: z.number(),
  }).optional().describe("Filter facets for UI"),
})

export type FilteredTaskListResponse = z.infer<typeof filteredTaskListResponseSchema>

// Saved filter presets
export const filterPresetSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100).describe("Preset name"),
  description: z.string().max(500).optional().describe("Preset description"),
  filters: advancedTaskFiltersSchema,
  isDefault: z.boolean().default(false).describe("Whether this is the default preset"),
  userId: z.string().describe("Owner user ID"),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
})

export type FilterPreset = z.infer<typeof filterPresetSchema>

export const filterPresetListResponseSchema = z.object({
  items: z.array(filterPresetSchema),
  total: z.number(),
})

export type FilterPresetListResponse = z.infer<typeof filterPresetListResponseSchema>
