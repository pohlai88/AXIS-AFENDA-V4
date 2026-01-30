import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, varchar, index, foreignKey } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

/**
 * MagicToDo Drizzle Schema
 *
 * Individual-first tenancy: all tasks/projects scoped by user_id.
 * Supports future org/team expansion via FK references.
 */

// ============ Users Table ============
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ============ Projects Table ============
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("projects_user_id_idx").on(table.userId),
    archivedIdx: index("projects_archived_idx").on(table.archived),
  })
)

// ============ Recurrence Rules Table (before tasks for FK) ============
export const recurrenceRules = pgTable(
  "recurrence_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    frequency: varchar("frequency", { length: 20 }).notNull(),
    interval: integer("interval").notNull().default(1),
    daysOfWeek: jsonb("days_of_week").default([]),
    daysOfMonth: jsonb("days_of_month").default([]),
    endDate: timestamp("end_date", { withTimezone: true }),
    maxOccurrences: integer("max_occurrences"),
    occurrenceCount: integer("occurrence_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("recurrence_rules_user_id_idx").on(table.userId),
  })
)

// ============ Tasks Table ============
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
    // NOTE: self-referencing FK is declared in table config below to avoid TS self-initializer inference issues.
    parentTaskId: uuid("parent_task_id"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("todo"),
    priority: varchar("priority", { length: 10 }).notNull().default("medium"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    tags: jsonb("tags").default([]),
    recurrenceRuleId: uuid("recurrence_rule_id").references(() => recurrenceRules.id, { onDelete: "set null" }),
    isRecurrenceChild: boolean("is_recurrence_child").notNull().default(false),
    parentRecurrenceTaskId: uuid("parent_recurrence_task_id"),
    nextOccurrenceDate: timestamp("next_occurrence_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("tasks_user_id_idx").on(table.userId),
    projectIdIdx: index("tasks_project_id_idx").on(table.projectId),
    statusIdx: index("tasks_status_idx").on(table.status),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
    priorityIdx: index("tasks_priority_idx").on(table.priority),
    parentTaskFk: foreignKey({
      columns: [table.parentTaskId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
  })
)

// ============ Task History ============
export const taskHistory = pgTable(
  "task_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(),
    previousValues: jsonb("previous_values"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdIdx: index("task_history_task_id_idx").on(table.taskId),
    userIdIdx: index("task_history_user_id_idx").on(table.userId),
  })
)

// ============ Relations ============
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
  recurrenceRules: many(recurrenceRules),
  taskHistory: many(taskHistory),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id] }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  recurrenceRule: one(recurrenceRules, { fields: [tasks.recurrenceRuleId], references: [recurrenceRules.id] }),
  history: many(taskHistory),
}))

export const recurrenceRulesRelations = relations(recurrenceRules, ({ one, many }) => ({
  user: one(users, { fields: [recurrenceRules.userId], references: [users.id] }),
  tasks: many(tasks),
}))

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, { fields: [taskHistory.taskId], references: [tasks.id] }),
  user: one(users, { fields: [taskHistory.userId], references: [users.id] }),
}))

// ============ Tenant Design System ============
/**
 * Tenant-scoped design system settings.
 * Stores customizable theme variables (base color, theme color, menu colors, font, radius)
 * that are applied at runtime via CSS variables.
 *
 * Reference: shadcn/ui create implementation (MIT licensed)
 */
export const tenantDesignSystem = pgTable("tenant_design_system", {
  tenantId: text("tenant_id").primaryKey(),
  settings: jsonb("settings").$type<{
    style?: string
    baseColor?: string
    brandColor?: string
    theme?: "light" | "dark" | "system"
    menuColor?: string
    menuAccent?: string
    menuColorLight?: string
    menuColorDark?: string
    menuAccentLight?: string
    menuAccentDark?: string
    font?: string
    radius?: number
  }>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

