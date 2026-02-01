import { pgTable, unique, uuid, varchar, timestamp, boolean, text, integer, jsonb, serial } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	used: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	color: varchar({ length: 7 }),
	archived: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const recurrenceRules = pgTable("recurrence_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	frequency: varchar({ length: 20 }).notNull(),
	interval: integer().default(1).notNull(),
	daysOfWeek: jsonb("days_of_week").default([]),
	daysOfMonth: jsonb("days_of_month").default([]),
	endDate: timestamp("end_date", { withTimezone: true, mode: 'string' }),
	maxOccurrences: integer("max_occurrences"),
	occurrenceCount: integer("occurrence_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const taskHistory = pgTable("task_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	userId: uuid("user_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	previousValues: jsonb("previous_values"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	projectId: uuid("project_id"),
	parentTaskId: uuid("parent_task_id"),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	status: varchar({ length: 20 }).default('todo').notNull(),
	priority: varchar({ length: 10 }).default('medium').notNull(),
	dueDate: timestamp("due_date", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	tags: jsonb().default([]),
	recurrenceRuleId: uuid("recurrence_rule_id"),
	isRecurrenceChild: boolean("is_recurrence_child").default(false).notNull(),
	parentRecurrenceTaskId: uuid("parent_recurrence_task_id"),
	nextOccurrenceDate: timestamp("next_occurrence_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const tenantDesignSystem = pgTable("tenant_design_system", {
	tenantId: text("tenant_id").primaryKey().notNull(),
	settings: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 50 }).notNull(),
	provider: varchar({ length: 50 }).notNull(),
	providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
	refreshToken: varchar("refresh_token", { length: 1000 }),
	accessToken: varchar("access_token", { length: 1000 }),
	expiresAt: integer("expires_at"),
	tokenType: varchar("token_type", { length: 50 }),
	scope: varchar({ length: 500 }),
	idToken: varchar("id_token", { length: 2000 }),
	sessionState: varchar("session_state", { length: 500 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionToken: varchar("session_token", { length: 255 }).notNull(),
	userId: uuid("user_id").notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	user: jsonb().notNull(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("sessions_session_token_unique").on(table.sessionToken),
]);

export const userActivityLog = pgTable("user_activity_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	action: varchar({ length: 50 }).notNull(),
	resource: varchar({ length: 100 }),
	resourceId: varchar("resource_id", { length: 255 }),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: varchar("user_agent", { length: 500 }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
	identifier: varchar({ length: 255 }).notNull(),
	token: varchar({ length: 255 }).notNull(),
	expires: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("verification_tokens_token_unique").on(table.token),
]);

export const loginAttempts = pgTable("login_attempts", {
	id: serial().primaryKey().notNull(),
	identifier: text().notNull(),
	attempts: integer().default(1).notNull(),
	windowStart: timestamp("window_start", { withTimezone: true, mode: 'string' }).notNull(),
	lockedUntil: timestamp("locked_until", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	organizationId: uuid("organization_id").notNull(),
	teamId: uuid("team_id"),
	role: varchar({ length: 50 }).default('member').notNull(),
	permissions: jsonb().default({}),
	invitedBy: uuid("invited_by"),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	logo: varchar({ length: 500 }),
	settings: jsonb().default({}),
	createdBy: uuid("created_by"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("organizations_slug_unique").on(table.slug),
]);

export const resourceShares = pgTable("resource_shares", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	resourceType: varchar("resource_type", { length: 50 }).notNull(),
	resourceId: uuid("resource_id").notNull(),
	ownerId: uuid("owner_id").notNull(),
	sharedWithUserId: uuid("shared_with_user_id"),
	sharedWithTeamId: uuid("shared_with_team_id"),
	sharedWithOrganizationId: uuid("shared_with_organization_id"),
	permissions: jsonb().default({"read":true,"admin":false,"write":false}).notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const teams = pgTable("teams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	organizationId: uuid("organization_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 100 }).notNull(),
	description: text(),
	parentId: uuid("parent_id"),
	settings: jsonb().default({}),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});
