import { relations } from "drizzle-orm"
import {
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  jsonb,
  varchar,
  index,
  foreignKey,
  serial,
} from "drizzle-orm/pg-core"

import { TASK_PRIORITY, TASK_STATUS } from "@/lib/contracts/tasks"
import { ORGANIZATION, TEAM } from "@/lib/constants"

/**
 * AFENDA Drizzle schema (best-practice Neon Auth integration).
 *
 * - Auth is managed by Neon Auth in `neon_auth.*`.
 * - Public schema contains ONLY business tables + app-owned profile/preferences.
 * - Business tables FK to `neon_auth.user.id` for referential integrity.
 */

// ============ Neon Auth (reference-only; managed by Neon) ============
export const neonAuth = pgSchema("neon_auth")

// Minimal table shape for FK references. Neon owns the full schema.
export const neonAuthUsers = neonAuth.table("user", {
  id: uuid("id").primaryKey(),
})

// ============ App-owned user profile/preferences (NOT auth source-of-truth) ============
export const userProfiles = pgTable(
  "neon_user_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }),
    avatar: varchar("avatar", { length: 500 }),
    role: varchar("role", { length: 50 }).notNull().default("user"),
    preferences: jsonb("preferences").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("neon_user_profiles_email_idx").on(table.email),
    roleIdx: index("neon_user_profiles_role_idx").on(table.role),
  })
)

// ============ Login Attempts (rate limiting; app-owned) ============
export const loginAttempts = pgTable(
  "neon_login_attempts",
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
    identifierIdx: index("neon_login_attempts_identifier_idx").on(table.identifier),
    lockedIdx: index("neon_login_attempts_locked_idx").on(table.lockedUntil),
  })
)

// ============ Unlock Tokens (account lockout recovery; app-owned) ============
export const unlockTokens = pgTable(
  "neon_unlock_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /**
     * SHA-256 hex of lowercased email (avoid storing raw emails in DB).
     */
    identifierHash: varchar("identifier_hash", { length: 64 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    identifierHashIdx: index("neon_unlock_tokens_identifier_hash_idx").on(table.identifierHash),
    expiresAtIdx: index("neon_unlock_tokens_expires_at_idx").on(table.expiresAt),
  })
)

// ============ User Activity Log (attributed) ============
export const userActivityLog = pgTable(
  "neon_user_activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(),
    resource: varchar("resource", { length: 100 }),
    resourceId: varchar("resource_id", { length: 255 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("neon_user_activity_log_user_id_idx").on(table.userId),
    actionIdx: index("neon_user_activity_log_action_idx").on(table.action),
    createdAtIdx: index("neon_user_activity_log_created_at_idx").on(table.createdAt),
  })
)

// ============ Security Event Log (unauthenticated-safe) ============
export const securityEventLog = pgTable(
  "neon_security_event_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => neonAuthUsers.id, { onDelete: "set null" }),
    action: varchar("action", { length: 50 }).notNull(),
    success: boolean("success").notNull().default(false),
    identifierHash: varchar("identifier_hash", { length: 64 }),
    identifierType: varchar("identifier_type", { length: 32 }),
    requestId: varchar("request_id", { length: 100 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: varchar("user_agent", { length: 500 }),
    errorMessage: text("error_message"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actionIdx: index("neon_security_event_log_action_idx").on(table.action),
    createdAtIdx: index("neon_security_event_log_created_at_idx").on(table.createdAt),
    identifierHashIdx: index("neon_security_event_log_identifier_hash_idx").on(table.identifierHash),
  })
)

// ============ Organizations ============
export const organizations = pgTable(
  "neon_organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: ORGANIZATION.MAX_NAME_LENGTH }).notNull(),
    slug: varchar("slug", { length: ORGANIZATION.MAX_SLUG_LENGTH }).notNull().unique(),
    description: text("description"),
    logo: varchar("logo", { length: 500 }),
    settings: jsonb("settings").default({}),
    createdBy: uuid("created_by").references(() => neonAuthUsers.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index("neon_organizations_slug_idx").on(table.slug),
    nameIdx: index("neon_organizations_name_idx").on(table.name),
    isActiveIdx: index("neon_organizations_is_active_idx").on(table.isActive),
  })
)

// ============ Teams ============
export const teams = pgTable(
  "neon_teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: TEAM.MAX_NAME_LENGTH }).notNull(),
    slug: varchar("slug", { length: TEAM.MAX_SLUG_LENGTH }).notNull(),
    description: text("description"),
    parentId: uuid("parent_id"),
    settings: jsonb("settings").default({}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    organizationIdIdx: index("neon_teams_organization_id_idx").on(table.organizationId),
    slugIdx: index("neon_teams_slug_idx").on(table.slug),
    parentIdIdx: index("neon_teams_parent_id_idx").on(table.parentId),
    uniqueTeamSlug: index("neon_teams_unique_slug").on(table.organizationId, table.slug),
    isActiveIdx: index("neon_teams_is_active_idx").on(table.isActive),
    parentTeamFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  })
)

// ============ Memberships ============
export const memberships = pgTable(
  "neon_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull().default(ORGANIZATION.DEFAULT_ROLE),
    permissions: jsonb("permissions").default({}),
    invitedBy: uuid("invited_by").references(() => neonAuthUsers.id, { onDelete: "set null" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("neon_memberships_user_id_idx").on(table.userId),
    organizationIdIdx: index("neon_memberships_organization_id_idx").on(table.organizationId),
    teamIdIdx: index("neon_memberships_team_id_idx").on(table.teamId),
    uniqueMembership: index("neon_memberships_unique").on(table.userId, table.organizationId, table.teamId),
    roleIdx: index("neon_memberships_role_idx").on(table.role),
    isActiveIdx: index("neon_memberships_is_active_idx").on(table.isActive),
  })
)

// ============ Resource Shares ============
export const resourceShares = pgTable(
  "neon_resource_shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceType: varchar("resource_type", { length: 50 }).notNull(),
    resourceId: uuid("resource_id").notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    sharedWithUserId: uuid("shared_with_user_id").references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    sharedWithTeamId: uuid("shared_with_team_id").references(() => teams.id, { onDelete: "cascade" }),
    sharedWithOrganizationId: uuid("shared_with_organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    permissions: jsonb("permissions").notNull().default({ read: true, write: false, admin: false }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    resourceIdIdx: index("neon_resource_shares_resource_id_idx").on(table.resourceId),
    ownerIdIdx: index("neon_resource_shares_owner_id_idx").on(table.ownerId),
    sharedWithUserIdx: index("neon_resource_shares_shared_with_user_idx").on(table.sharedWithUserId),
    sharedWithTeamIdx: index("neon_resource_shares_shared_with_team_idx").on(table.sharedWithTeamId),
    sharedWithOrgIdx: index("neon_resource_shares_shared_with_org_idx").on(table.sharedWithOrganizationId),
    expiresAtIdx: index("neon_resource_shares_expires_at_idx").on(table.expiresAt),
    uniqueShare: index("neon_resource_shares_unique").on(
      table.resourceType,
      table.resourceId,
      table.sharedWithUserId,
      table.sharedWithTeamId,
      table.sharedWithOrganizationId
    ),
  })
)

// ============ Subdomain Configuration ============
export const subdomainConfig = pgTable(
  "neon_subdomain_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subdomain: varchar("subdomain", { length: 63 }).notNull().unique(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "restrict" }),
    customization: jsonb("customization").notNull().default({ brandColor: null, logo: null, description: null }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdx: index("neon_subdomain_config_org_id_idx").on(table.organizationId),
    subdomainIdx: index("neon_subdomain_config_subdomain_idx").on(table.subdomain),
    activeIdx: index("neon_subdomain_config_is_active_idx").on(table.isActive),
    primaryIdx: index("neon_subdomain_config_is_primary_idx").on(table.isPrimary, table.organizationId),
  })
)

// ============ Tenant Design System ============
export const tenantDesignSystem = pgTable("neon_tenant_design_system", {
  tenantId: text("tenant_id").primaryKey(),
  settings: jsonb("settings")
    .$type<{
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
    }>()
    .notNull()
    .default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// ============ Projects ============
export const projects = pgTable(
  "neon_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    /**
     * Optional org scoping for multi-tenant expansion.
     * When set, access is additionally constrained by org membership (RLS).
     */
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    /**
     * Optional team scoping for multi-tenant expansion.
     * When set, access is additionally constrained by team membership (RLS).
     */
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 7 }),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("neon_projects_user_id_idx").on(table.userId),
    organizationIdIdx: index("neon_projects_organization_id_idx").on(table.organizationId),
    teamIdIdx: index("neon_projects_team_id_idx").on(table.teamId),
    archivedIdx: index("neon_projects_archived_idx").on(table.archived),
  })
)

// ============ Recurrence Rules ============
export const recurrenceRules = pgTable(
  "neon_recurrence_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
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
    userIdIdx: index("neon_recurrence_rules_user_id_idx").on(table.userId),
    organizationIdIdx: index("neon_recurrence_rules_organization_id_idx").on(table.organizationId),
    teamIdIdx: index("neon_recurrence_rules_team_id_idx").on(table.teamId),
  })
)

// ============ Tasks ============
export const tasks = pgTable(
  "neon_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "set null" }),
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
    userIdIdx: index("neon_tasks_user_id_idx").on(table.userId),
    organizationIdIdx: index("neon_tasks_organization_id_idx").on(table.organizationId),
    teamIdIdx: index("neon_tasks_team_id_idx").on(table.teamId),
    projectIdIdx: index("neon_tasks_project_id_idx").on(table.projectId),
    statusIdx: index("neon_tasks_status_idx").on(table.status),
    dueDateIdx: index("neon_tasks_due_date_idx").on(table.dueDate),
    priorityIdx: index("neon_tasks_priority_idx").on(table.priority),
    parentTaskFk: foreignKey({
      columns: [table.parentTaskId],
      foreignColumns: [table.id],
    }).onDelete("cascade"),
  })
)

// ============ Task History ============
export const taskHistory = pgTable(
  "neon_task_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(),
    previousValues: jsonb("previous_values"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    taskIdIdx: index("neon_task_history_task_id_idx").on(table.taskId),
    userIdIdx: index("neon_task_history_user_id_idx").on(table.userId),
    organizationIdIdx: index("neon_task_history_organization_id_idx").on(table.organizationId),
    teamIdIdx: index("neon_task_history_team_id_idx").on(table.teamId),
  })
)

// ============ Relations ============
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(neonAuthUsers, { fields: [userProfiles.userId], references: [neonAuthUsers.id] }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(neonAuthUsers, { fields: [projects.userId], references: [neonAuthUsers.id] }),
  tasks: many(tasks),
}))

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(neonAuthUsers, { fields: [tasks.userId], references: [neonAuthUsers.id] }),
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id] }),
  subtasks: many(tasks, { relationName: "subtasks" }),
  recurrenceRule: one(recurrenceRules, { fields: [tasks.recurrenceRuleId], references: [recurrenceRules.id] }),
  history: many(taskHistory),
}))

export const recurrenceRulesRelations = relations(recurrenceRules, ({ one, many }) => ({
  user: one(neonAuthUsers, { fields: [recurrenceRules.userId], references: [neonAuthUsers.id] }),
  tasks: many(tasks),
}))

export const taskHistoryRelations = relations(taskHistory, ({ one }) => ({
  task: one(tasks, { fields: [taskHistory.taskId], references: [tasks.id] }),
  user: one(neonAuthUsers, { fields: [taskHistory.userId], references: [neonAuthUsers.id] }),
}))

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  createdByUser: one(neonAuthUsers, { fields: [organizations.createdBy], references: [neonAuthUsers.id] }),
  teams: many(teams),
  memberships: many(memberships),
  resourceShares: many(resourceShares),
  subdomains: many(subdomainConfig),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  organization: one(organizations, { fields: [teams.organizationId], references: [organizations.id] }),
  parent: one(teams, { fields: [teams.parentId], references: [teams.id], relationName: "teamHierarchy" }),
  children: many(teams, { relationName: "teamHierarchy" }),
  memberships: many(memberships),
  resourceShares: many(resourceShares),
  subdomains: many(subdomainConfig),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(neonAuthUsers, { fields: [memberships.userId], references: [neonAuthUsers.id] }),
  organization: one(organizations, { fields: [memberships.organizationId], references: [organizations.id] }),
  team: one(teams, { fields: [memberships.teamId], references: [teams.id] }),
  invitedByUser: one(neonAuthUsers, { fields: [memberships.invitedBy], references: [neonAuthUsers.id] }),
}))

export const resourceSharesRelations = relations(resourceShares, ({ one }) => ({
  owner: one(neonAuthUsers, { fields: [resourceShares.ownerId], references: [neonAuthUsers.id] }),
  sharedWithUser: one(neonAuthUsers, { fields: [resourceShares.sharedWithUserId], references: [neonAuthUsers.id] }),
  sharedWithTeam: one(teams, { fields: [resourceShares.sharedWithTeamId], references: [teams.id] }),
  sharedWithOrganization: one(organizations, {
    fields: [resourceShares.sharedWithOrganizationId],
    references: [organizations.id],
  }),
}))

export const userActivityLogRelations = relations(userActivityLog, ({ one }) => ({
  user: one(neonAuthUsers, { fields: [userActivityLog.userId], references: [neonAuthUsers.id] }),
}))

export const securityEventLogRelations = relations(securityEventLog, ({ one }) => ({
  user: one(neonAuthUsers, { fields: [securityEventLog.userId], references: [neonAuthUsers.id] }),
}))

