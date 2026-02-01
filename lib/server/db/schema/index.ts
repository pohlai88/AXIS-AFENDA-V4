import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, varchar, index, foreignKey, serial } from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

import { TASK_PRIORITY, TASK_STATUS } from "@/lib/contracts/tasks"
import { ORGANIZATION, TEAM, RESOURCE_SHARING } from "@/lib/constants"

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

// ============ Login Attempts Table (rate limiting) ============
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    identifier: text("identifier").notNull(),
    attempts: integer("attempts").notNull().default(1),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    identifierIdx: index("login_attempts_identifier_idx").on(table.identifier),
    lockedIdx: index("login_attempts_locked_idx").on(table.lockedUntil),
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
    status: varchar("status", { length: 20 }).notNull().default(TASK_STATUS.TODO),
    priority: varchar("priority", { length: 10 }).notNull().default(TASK_PRIORITY.MEDIUM),
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
// Note: Relations are defined after all tables to avoid reference errors

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

// ============ Organizations Table ============
export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: ORGANIZATION.MAX_NAME_LENGTH }).notNull(),
    slug: varchar("slug", { length: ORGANIZATION.MAX_SLUG_LENGTH }).notNull().unique(),
    description: text("description"),
    logo: varchar("logo", { length: 500 }),
    settings: jsonb("settings").default({}),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index("organizations_slug_idx").on(table.slug),
    nameIdx: index("organizations_name_idx").on(table.name),
    isActiveIdx: index("organizations_is_active_idx").on(table.isActive),
  })
)

// ============ Teams Table ============
export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: TEAM.MAX_NAME_LENGTH }).notNull(),
    slug: varchar("slug", { length: TEAM.MAX_SLUG_LENGTH }).notNull(),
    description: text("description"),
    parentId: uuid("parent_id").references(() => teams.id, { onDelete: "set null" }),
    settings: jsonb("settings").default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index("teams_organization_id_idx").on(table.organizationId),
    slugIdx: index("teams_slug_idx").on(table.slug),
    parentIdIdx: index("teams_parent_id_idx").on(table.parentId),
    uniqueTeamSlug: index("teams_unique_slug").on(table.organizationId, table.slug),
    isActiveIdx: index("teams_is_active_idx").on(table.isActive),
  })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) as any

// ============ Memberships Table ============
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default(ORGANIZATION.DEFAULT_ROLE),
    permissions: jsonb("permissions").default({}),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("memberships_user_id_idx").on(table.userId),
    organizationIdIdx: index("memberships_organization_id_idx").on(table.organizationId),
    teamIdIdx: index("memberships_team_id_idx").on(table.teamId),
    uniqueMembership: index("memberships_unique").on(table.userId, table.organizationId, table.teamId),
    roleIdx: index("memberships_role_idx").on(table.role),
    isActiveIdx: index("memberships_is_active_idx").on(table.isActive),
  })
)

// ============ Resource Shares Table ============
export const resourceShares = pgTable(
  "resource_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    sharedWithUserId: uuid("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }),
    sharedWithTeamId: uuid("shared_with_team_id").references(() => teams.id, { onDelete: "cascade" }),
    sharedWithOrganizationId: uuid("shared_with_organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    permissions: jsonb("permissions").notNull().default({ read: true, write: false, admin: false }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    resourceIdIdx: index("resource_shares_resource_id_idx").on(table.resourceId),
    ownerIdIdx: index("resource_shares_owner_id_idx").on(table.ownerId),
    sharedWithUserIdx: index("resource_shares_shared_with_user_idx").on(table.sharedWithUserId),
    sharedWithTeamIdx: index("resource_shares_shared_with_team_idx").on(table.sharedWithTeamId),
    sharedWithOrgIdx: index("resource_shares_shared_with_org_idx").on(table.sharedWithOrganizationId),
    expiresAtIdx: index("resource_shares_expires_at_idx").on(table.expiresAt),
    uniqueShare: index("resource_shares_unique").on(
      table.resourceType,
      table.resourceId,
      table.sharedWithUserId,
      table.sharedWithTeamId,
      table.sharedWithOrganizationId
    ),
  })
)

// ============ Relations for New Tables ============
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  teams: many(teams),
  memberships: many(memberships),
  resourceShares: many(resourceShares),
  owner: one(users, {
    fields: [organizations.id],
    references: [users.id],
    relationName: "ownedOrganizations"
  }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, { fields: [teams.organizationId], references: [organizations.id] }),
  parent: one(teams, { fields: [teams.parentId], references: [teams.id], relationName: "teamHierarchy" }),
  children: many(teams, { relationName: "teamHierarchy" }),
  memberships: many(memberships),
  resourceShares: many(resourceShares),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  organization: one(organizations, { fields: [memberships.organizationId], references: [organizations.id] }),
  team: one(teams, { fields: [memberships.teamId], references: [teams.id] }),
  invitedByUser: one(users, { fields: [memberships.invitedBy], references: [users.id] }),
}))

export const resourceSharesRelations = relations(resourceShares, ({ one }) => ({
  owner: one(users, { fields: [resourceShares.ownerId], references: [users.id] }),
  sharedWithUser: one(users, { fields: [resourceShares.sharedWithUserId], references: [users.id] }),
  sharedWithTeam: one(teams, { fields: [resourceShares.sharedWithTeamId], references: [teams.id] }),
  sharedWithOrganization: one(organizations, { fields: [resourceShares.sharedWithOrganizationId], references: [organizations.id] }),
}))

// Update users relations to include new relationships
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
  recurrenceRules: many(recurrenceRules),
  taskHistory: many(taskHistory),
  accounts: many(accounts),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  userActivityLog: many(userActivityLog),
  // New relations
  ownedOrganizations: many(organizations, { relationName: "ownedOrganizations" }),
  memberships: many(memberships),
  ownedResourceShares: many(resourceShares),
  sharedResourceShares: many(resourceShares),
  invitedMemberships: many(memberships, { relationName: "invitedByUser" }),
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

