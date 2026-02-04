import { relations } from "drizzle-orm"
import { sql } from "drizzle-orm"
import {
  customType,
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
  primaryKey,
  serial,
  unique,
} from "drizzle-orm/pg-core"

import { TASK_PRIORITY, TASK_STATUS } from "@/lib/contracts/tasks"
import { ORGANIZATION, TEAM } from "@/lib/constants"

// PostgreSQL tsvector for full-text search (magicfolder_object_index.search_vector, trigger-maintained)
const tsvector = customType<{ data: string | null; driverData: string | null }>({
  dataType() {
    return "tsvector"
  },
  toDriver(value) {
    return value
  },
  fromDriver(value) {
    return value as string | null
  },
})

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

// ============ R2 file metadata (Cloudflare R2 + Neon — see neon.com/docs/guides/cloudflare-r2) ============
export const r2Files = pgTable(
  "neon_r2_files",
  {
    id: serial("id").primaryKey(),
    objectKey: text("object_key").notNull().unique(),
    fileUrl: text("file_url").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    uploadTimestamp: timestamp("upload_timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    objectKeyIdx: index("neon_r2_files_object_key_idx").on(table.objectKey),
    userIdIdx: index("neon_r2_files_user_id_idx").on(table.userId),
    uploadTimestampIdx: index("neon_r2_files_upload_timestamp_idx").on(table.uploadTimestamp),
  })
)

// ============ MagicFolder (document-first: objects, versions, uploads, duplicate groups) ============
export const magicfolderObjects = pgTable(
  "magicfolder_objects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    currentVersionId: uuid("current_version_id"),
    title: varchar("title", { length: 500 }),
    docType: varchar("doc_type", { length: 50 }).notNull().default("other"),
    status: varchar("status", { length: 50 }).notNull().default("inbox"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("magicfolder_objects_tenant_id_idx").on(table.tenantId),
    ownerIdIdx: index("magicfolder_objects_owner_id_idx").on(table.ownerId),
    statusIdx: index("magicfolder_objects_status_idx").on(table.status),
    deletedAtIdx: index("magicfolder_objects_deleted_at_idx").on(table.deletedAt),
    // current_version_id FK to magicfolder_object_versions.id (SET NULL) applied in migration 0007
  })
)

export const magicfolderObjectVersions = pgTable(
  "magicfolder_object_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    objectId: uuid("object_id")
      .notNull()
      .references(() => magicfolderObjects.id, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    r2Key: text("r2_key").notNull(),
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    objectIdIdx: index("magicfolder_object_versions_object_id_idx").on(table.objectId),
    tenantSha256Idx: index("magicfolder_object_versions_sha256_idx").on(table.sha256),
  })
)

export const magicfolderUploads = pgTable(
  "magicfolder_uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    objectId: uuid("object_id").notNull(),
    versionId: uuid("version_id").notNull(),
    filename: varchar("filename", { length: 500 }).notNull(),
    mimeType: varchar("mime_type", { length: 255 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    r2KeyQuarantine: text("r2_key_quarantine").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("presigned"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("magicfolder_uploads_tenant_id_idx").on(table.tenantId),
    statusIdx: index("magicfolder_uploads_status_idx").on(table.status),
    sha256Idx: index("magicfolder_uploads_sha256_idx").on(table.sha256),
  })
)

export const magicfolderDuplicateGroups = pgTable(
  "magicfolder_duplicate_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    reason: varchar("reason", { length: 20 }).notNull(),
    keepVersionId: uuid("keep_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("magicfolder_duplicate_groups_tenant_id_idx").on(table.tenantId),
    keepVersionIdIdx: index("magicfolder_duplicate_groups_keep_version_id_idx").on(table.keepVersionId),
    keepVersionFk: foreignKey({
      columns: [table.keepVersionId],
      foreignColumns: [magicfolderObjectVersions.id],
    }).onDelete("set null"),
  })
)

export const magicfolderDuplicateGroupVersions = pgTable(
  "magicfolder_duplicate_group_versions",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => magicfolderDuplicateGroups.id, { onDelete: "cascade" }),
    versionId: uuid("version_id")
      .notNull()
      .references(() => magicfolderObjectVersions.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.groupId, table.versionId] }),
    groupIdIdx: index("magicfolder_dup_group_versions_group_id_idx").on(table.groupId),
  })
)

export const magicfolderObjectIndex = pgTable(
  "magicfolder_object_index",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    objectId: uuid("object_id")
      .notNull()
      .references(() => magicfolderObjects.id, { onDelete: "cascade" }),
    extractedText: text("extracted_text"),
    extractedFields: jsonb("extracted_fields").$type<Record<string, unknown>>(),
    textHash: varchar("text_hash", { length: 64 }),
    /** FTS column; maintained by trigger magicfolder_object_index_search_vector_trg (migration 0011). */
    searchVector: tsvector("search_vector"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    objectIdIdx: index("magicfolder_object_index_object_id_idx").on(table.objectId),
    textHashIdx: index("magicfolder_object_index_text_hash_idx").on(table.textHash),
    // GIN index on search_vector created by migration 0011 (trigger-maintained tsvector)
  })
)

export const magicfolderTags = pgTable(
  "magicfolder_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantSlugIdx: index("magicfolder_tags_tenant_slug_idx").on(table.tenantId, table.slug),
  })
)

export const magicfolderObjectTags = pgTable(
  "magicfolder_object_tags",
  {
    objectId: uuid("object_id")
      .notNull()
      .references(() => magicfolderObjects.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => magicfolderTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.objectId, table.tagId] }),
    objectIdIdx: index("magicfolder_object_tags_object_id_idx").on(table.objectId),
    tagIdIdx: index("magicfolder_object_tags_tag_id_idx").on(table.tagId),
  })
)

// ============ MagicFolder Saved Views ============
export const magicfolderSavedViews = pgTable(
  "magicfolder_saved_views",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    filters: jsonb("filters").notNull().default({}),
    viewMode: varchar("view_mode", { length: 50 }).notNull().default("cards"),
    sortBy: varchar("sort_by", { length: 50 }).notNull().default("createdAt"),
    sortOrder: varchar("sort_order", { length: 10 }).notNull().default("desc"),
    isPublic: boolean("is_public").notNull().default(false),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameUniquePerUser: index("magicfolder_saved_views_name_unique_per_user").on(
      table.tenantId,
      table.userId,
      table.name
    ),
    tenantIdIdx: index("magicfolder_saved_views_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("magicfolder_saved_views_user_id_idx").on(table.userId),
  })
)

// ============ MagicFolder User Preferences ============
export const magicfolderUserPreferences = pgTable(
  "magicfolder_user_preferences",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => neonAuthUsers.id, { onDelete: "cascade" }),
    defaultView: varchar("default_view", { length: 50 }).notNull().default("cards"),
    itemsPerPage: integer("items_per_page").notNull().default(20),
    defaultSort: varchar("default_sort", { length: 50 }).notNull().default("createdAt-desc"),
    showFileExtensions: boolean("show_file_extensions").notNull().default(true),
    showThumbnails: boolean("show_thumbnails").notNull().default(true),
    compactMode: boolean("compact_mode").notNull().default(false),
    quickSettings: jsonb("quick_settings").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    magicfolderUserPreferencesTenantUserUnique: unique(
      "magicfolder_user_preferences_tenant_user_unique"
    ).on(table.tenantId, table.userId),
    tenantIdIdx: index("magicfolder_user_preferences_tenant_id_idx").on(table.tenantId),
    userIdIdx: index("magicfolder_user_preferences_user_id_idx").on(table.userId),
  })
)

// ============ MagicFolder Tenant Settings ============
export const magicfolderTenantSettings = pgTable(
  "magicfolder_tenant_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: varchar("tenant_id", { length: 255 }).notNull().unique(),
    documentTypes: jsonb("document_types").notNull().default([
      { value: "invoice", label: "Invoices", enabled: true },
      { value: "contract", label: "Contracts", enabled: true },
      { value: "receipt", label: "Receipts", enabled: true },
      { value: "other", label: "Other", enabled: true },
    ]),
    statusWorkflow: jsonb("status_workflow").notNull().default([
      { value: "inbox", label: "Inbox", color: "#3b82f6", enabled: true },
      { value: "active", label: "Active", color: "#22c55e", enabled: true },
      { value: "archived", label: "Archived", color: "#6b7280", enabled: true },
      { value: "deleted", label: "Deleted", color: "#ef4444", enabled: true },
    ]),
    enableAiSuggestions: boolean("enable_ai_suggestions").notNull().default(true),
    enablePublicShares: boolean("enable_public_shares").notNull().default(true),
    maxFileSizeMb: integer("max_file_size_mb").notNull().default(100),
    allowedFileTypes: text("allowed_file_types").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdIdx: index("magicfolder_tenant_settings_tenant_id_idx").on(table.tenantId),
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

// ============ MagicFolder relations ============
export const magicfolderObjectsRelations = relations(magicfolderObjects, ({ one, many }) => ({
  owner: one(neonAuthUsers, { fields: [magicfolderObjects.ownerId], references: [neonAuthUsers.id] }),
  currentVersion: one(magicfolderObjectVersions, {
    fields: [magicfolderObjects.currentVersionId],
    references: [magicfolderObjectVersions.id],
  }),
  versions: many(magicfolderObjectVersions),
  index: many(magicfolderObjectIndex),
  objectTags: many(magicfolderObjectTags),
}))

export const magicfolderObjectVersionsRelations = relations(magicfolderObjectVersions, ({ one, many }) => ({
  object: one(magicfolderObjects, { fields: [magicfolderObjectVersions.objectId], references: [magicfolderObjects.id] }),
  duplicateGroupVersions: many(magicfolderDuplicateGroupVersions),
}))

export const magicfolderUploadsRelations = relations(magicfolderUploads, ({ one }) => ({
  owner: one(neonAuthUsers, { fields: [magicfolderUploads.ownerId], references: [neonAuthUsers.id] }),
}))

export const magicfolderDuplicateGroupsRelations = relations(magicfolderDuplicateGroups, ({ one, many }) => ({
  keepVersion: one(magicfolderObjectVersions, {
    fields: [magicfolderDuplicateGroups.keepVersionId],
    references: [magicfolderObjectVersions.id],
  }),
  versions: many(magicfolderDuplicateGroupVersions),
}))

export const magicfolderDuplicateGroupVersionsRelations = relations(
  magicfolderDuplicateGroupVersions,
  ({ one }) => ({
    group: one(magicfolderDuplicateGroups, {
      fields: [magicfolderDuplicateGroupVersions.groupId],
      references: [magicfolderDuplicateGroups.id],
    }),
    version: one(magicfolderObjectVersions, {
      fields: [magicfolderDuplicateGroupVersions.versionId],
      references: [magicfolderObjectVersions.id],
    }),
  })
)

export const magicfolderObjectIndexRelations = relations(magicfolderObjectIndex, ({ one }) => ({
  object: one(magicfolderObjects, {
    fields: [magicfolderObjectIndex.objectId],
    references: [magicfolderObjects.id],
  }),
}))

export const magicfolderTagsRelations = relations(magicfolderTags, ({ many }) => ({
  objectTags: many(magicfolderObjectTags),
}))

export const magicfolderObjectTagsRelations = relations(magicfolderObjectTags, ({ one }) => ({
  object: one(magicfolderObjects, {
    fields: [magicfolderObjectTags.objectId],
    references: [magicfolderObjects.id],
  }),
  tag: one(magicfolderTags, {
    fields: [magicfolderObjectTags.tagId],
    references: [magicfolderTags.id],
  }),
}))

export const magicfolderSavedViewsRelations = relations(magicfolderSavedViews, ({ one }) => ({
  user: one(neonAuthUsers, { fields: [magicfolderSavedViews.userId], references: [neonAuthUsers.id] }),
}))

export const magicfolderUserPreferencesRelations = relations(magicfolderUserPreferences, ({ one }) => ({
  user: one(neonAuthUsers, {
    fields: [magicfolderUserPreferences.userId],
    references: [neonAuthUsers.id],
  }),
}))

