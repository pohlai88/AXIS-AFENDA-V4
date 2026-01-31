import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, varchar, index, foreignKey } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

import { TASK_PRIORITY, TASK_STATUS } from "@/lib/contracts/tasks"

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
  username: varchar("username", { length: 100 }).unique(),
  avatar: varchar("avatar", { length: 500 }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  password: varchar("password", { length: 255 }),
  provider: varchar("provider", { length: 50 }).notNull().default("credentials"),
  providerAccountId: varchar("provider_account_id", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  loginCount: integer("login_count").notNull().default(0),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
  usernameIdx: index("users_username_idx").on(table.username),
  providerIdx: index("users_provider_idx").on(table.provider),
  roleIdx: index("users_role_idx").on(table.role),
}))

// ============ Accounts Table (legacy auth) ============
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 50 }).notNull(),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: varchar("refresh_token", { length: 1000 }),
    access_token: varchar("access_token", { length: 1000 }),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 50 }),
    scope: varchar("scope", { length: 500 }),
    id_token: varchar("id_token", { length: 2000 }),
    session_state: varchar("session_state", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
    providerIdx: index("accounts_provider_idx").on(table.provider),
    providerAccountIdx: index("accounts_provider_account_idx").on(table.providerAccountId),
  })
)

// ============ Sessions Table (legacy auth) ============
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
    // Legacy: user snapshot column kept for optional debugging/auditing.
    // Default keeps inserts simple and schema compatible with historical adapters.
    user: jsonb("user").notNull().default({}),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sessionTokenIdx: index("sessions_session_token_idx").on(table.sessionToken),
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
    expiresIdx: index("sessions_expires_idx").on(table.expires),
  })
)

// ============ Verification Tokens Table ============
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verification_tokens_identifier_idx").on(table.identifier),
    tokenIdx: index("verification_tokens_token_idx").on(table.token),
    expiresIdx: index("verification_tokens_expires_idx").on(table.expires),
  })
)

// ============ Password Reset Tokens Table ============
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
    used: boolean("used").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    tokenIdx: index("password_reset_tokens_token_idx").on(table.token),
    expiresIdx: index("password_reset_tokens_expires_idx").on(table.expires),
  })
)

// ============ User Activity Log Table ============
export const userActivityLog = pgTable(
  "user_activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(),
    resource: varchar("resource", { length: 100 }),
    resourceId: varchar("resource_id", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("user_activity_log_user_id_idx").on(table.userId),
    actionIdx: index("user_activity_log_action_idx").on(table.action),
    createdAtIdx: index("user_activity_log_created_at_idx").on(table.createdAt),
  })
)

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
    // Sync fields for offline support
    clientGeneratedId: varchar("client_generated_id", { length: 255 }).unique(),
    syncStatus: varchar("sync_status", { length: 20 }).notNull().default("synced"),
    syncVersion: integer("sync_version").notNull().default(1),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("projects_user_id_idx").on(table.userId),
    archivedIdx: index("projects_archived_idx").on(table.archived),
    clientGeneratedIdIdx: index("projects_client_generated_id_idx").on(table.clientGeneratedId),
    syncStatusIdx: index("projects_sync_status_idx").on(table.syncStatus),
    lastSyncedAtIdx: index("projects_last_synced_at_idx").on(table.lastSyncedAt),
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
    status: varchar("status", { length: 20 }).notNull().default(TASK_STATUS.TODO),
    priority: varchar("priority", { length: 10 }).notNull().default(TASK_PRIORITY.MEDIUM),
    dueDate: timestamp("due_date", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    tags: jsonb("tags").default([]),
    recurrenceRuleId: uuid("recurrence_rule_id").references(() => recurrenceRules.id, { onDelete: "set null" }),
    isRecurrenceChild: boolean("is_recurrence_child").notNull().default(false),
    parentRecurrenceTaskId: uuid("parent_recurrence_task_id"),
    nextOccurrenceDate: timestamp("next_occurrence_date", { withTimezone: true }),
    // Sync fields for offline support
    clientGeneratedId: varchar("client_generated_id", { length: 255 }).unique(),
    syncStatus: varchar("sync_status", { length: 20 }).notNull().default("synced"),
    syncVersion: integer("sync_version").notNull().default(1),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("tasks_user_id_idx").on(table.userId),
    projectIdIdx: index("tasks_project_id_idx").on(table.projectId),
    statusIdx: index("tasks_status_idx").on(table.status),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
    priorityIdx: index("tasks_priority_idx").on(table.priority),
    clientGeneratedIdIdx: index("tasks_client_generated_id_idx").on(table.clientGeneratedId),
    syncStatusIdx: index("tasks_sync_status_idx").on(table.syncStatus),
    lastSyncedAtIdx: index("tasks_last_synced_at_idx").on(table.lastSyncedAt),
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
  accounts: many(accounts),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  userActivityLog: many(userActivityLog),
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}))

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}))

export const userActivityLogRelations = relations(userActivityLog, ({ one }) => ({
  user: one(users, { fields: [userActivityLog.userId], references: [users.id] }),
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

