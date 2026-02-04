CREATE SCHEMA IF NOT EXISTS "neon_auth";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_duplicate_group_versions" (
	"group_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	CONSTRAINT "magicfolder_duplicate_group_versions_group_id_version_id_pk" PRIMARY KEY("group_id","version_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_duplicate_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"reason" varchar(20) NOT NULL,
	"keep_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_object_index" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_id" uuid NOT NULL,
	"extracted_text" text,
	"extracted_fields" jsonb,
	"text_hash" varchar(64),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_object_tags" (
	"object_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "magicfolder_object_tags_object_id_tag_id_pk" PRIMARY KEY("object_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_object_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"object_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"r2_key" text NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_objects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"current_version_id" uuid,
	"title" varchar(500),
	"doc_type" varchar(50) DEFAULT 'other' NOT NULL,
	"status" varchar(50) DEFAULT 'inbox' NOT NULL,
	"deleted_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magicfolder_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"owner_id" uuid NOT NULL,
	"object_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"filename" varchar(500) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size_bytes" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"r2_key_quarantine" text NOT NULL,
	"status" varchar(50) DEFAULT 'presigned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_id" uuid,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"permissions" jsonb DEFAULT '{}'::jsonb,
	"invited_by" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_auth"."user" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"logo" varchar(500),
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "neon_organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"team_id" uuid,
	"name" varchar(255) NOT NULL,
	"description" text,
	"color" varchar(7),
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_r2_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"object_key" text NOT NULL,
	"file_url" text NOT NULL,
	"user_id" uuid NOT NULL,
	"upload_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "neon_r2_files_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_recurrence_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"team_id" uuid,
	"frequency" varchar(20) NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"days_of_week" jsonb DEFAULT '[]'::jsonb,
	"days_of_month" jsonb DEFAULT '[]'::jsonb,
	"end_date" timestamp with time zone,
	"max_occurrences" integer,
	"occurrence_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_resource_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"resource_id" uuid NOT NULL,
	"owner_id" uuid NOT NULL,
	"shared_with_user_id" uuid,
	"shared_with_team_id" uuid,
	"shared_with_organization_id" uuid,
	"permissions" jsonb DEFAULT '{"read":true,"write":false,"admin":false}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_security_event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"identifier_hash" varchar(64),
	"identifier_type" varchar(32),
	"request_id" varchar(100),
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"error_message" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_subdomain_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subdomain" varchar(63) NOT NULL,
	"organization_id" uuid NOT NULL,
	"team_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by" uuid NOT NULL,
	"customization" jsonb DEFAULT '{"brandColor":null,"logo":null,"description":null}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "neon_subdomain_config_subdomain_unique" UNIQUE("subdomain")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_task_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"team_id" uuid,
	"action" varchar(50) NOT NULL,
	"previous_values" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"team_id" uuid,
	"project_id" uuid,
	"parent_task_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'todo' NOT NULL,
	"priority" varchar(10) DEFAULT 'medium' NOT NULL,
	"due_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"recurrence_rule_id" uuid,
	"is_recurrence_child" boolean DEFAULT false NOT NULL,
	"parent_recurrence_task_id" uuid,
	"next_occurrence_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"parent_id" uuid,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_tenant_design_system" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_unlock_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier_hash" varchar(64) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "neon_unlock_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_user_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"resource" varchar(100),
	"resource_id" varchar(255),
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "neon_user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"avatar" varchar(500),
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "magicfolder_duplicate_group_versions" ADD CONSTRAINT "magicfolder_duplicate_group_versions_group_id_magicfolder_duplicate_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."magicfolder_duplicate_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_duplicate_group_versions" ADD CONSTRAINT "magicfolder_duplicate_group_versions_version_id_magicfolder_object_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."magicfolder_object_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_object_index" ADD CONSTRAINT "magicfolder_object_index_object_id_magicfolder_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."magicfolder_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_object_tags" ADD CONSTRAINT "magicfolder_object_tags_object_id_magicfolder_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."magicfolder_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_object_tags" ADD CONSTRAINT "magicfolder_object_tags_tag_id_magicfolder_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."magicfolder_tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_object_versions" ADD CONSTRAINT "magicfolder_object_versions_object_id_magicfolder_objects_id_fk" FOREIGN KEY ("object_id") REFERENCES "public"."magicfolder_objects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_objects" ADD CONSTRAINT "magicfolder_objects_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_uploads" ADD CONSTRAINT "magicfolder_uploads_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_memberships" ADD CONSTRAINT "neon_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_memberships" ADD CONSTRAINT "neon_memberships_organization_id_neon_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_memberships" ADD CONSTRAINT "neon_memberships_team_id_neon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."neon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_memberships" ADD CONSTRAINT "neon_memberships_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "neon_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_organizations" ADD CONSTRAINT "neon_organizations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "neon_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_projects" ADD CONSTRAINT "neon_projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_projects" ADD CONSTRAINT "neon_projects_organization_id_neon_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_projects" ADD CONSTRAINT "neon_projects_team_id_neon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."neon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_r2_files" ADD CONSTRAINT "neon_r2_files_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_recurrence_rules" ADD CONSTRAINT "neon_recurrence_rules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_recurrence_rules" ADD CONSTRAINT "neon_recurrence_rules_organization_id_neon_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_recurrence_rules" ADD CONSTRAINT "neon_recurrence_rules_team_id_neon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."neon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_resource_shares" ADD CONSTRAINT "neon_resource_shares_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_resource_shares" ADD CONSTRAINT "neon_resource_shares_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_resource_shares" ADD CONSTRAINT "neon_resource_shares_shared_with_team_id_neon_teams_id_fk" FOREIGN KEY ("shared_with_team_id") REFERENCES "public"."neon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_resource_shares" ADD CONSTRAINT "neon_resource_shares_shared_with_organization_id_neon_organizations_id_fk" FOREIGN KEY ("shared_with_organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_security_event_log" ADD CONSTRAINT "neon_security_event_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_subdomain_config" ADD CONSTRAINT "neon_subdomain_config_organization_id_neon_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_subdomain_config" ADD CONSTRAINT "neon_subdomain_config_team_id_neon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."neon_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_subdomain_config" ADD CONSTRAINT "neon_subdomain_config_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "neon_auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_task_history" ADD CONSTRAINT "neon_task_history_task_id_neon_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."neon_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_task_history" ADD CONSTRAINT "neon_task_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_task_history" ADD CONSTRAINT "neon_task_history_organization_id_neon_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_task_history" ADD CONSTRAINT "neon_task_history_team_id_neon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."neon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_tasks" ADD CONSTRAINT "neon_tasks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_tasks" ADD CONSTRAINT "neon_tasks_organization_id_neon_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_tasks" ADD CONSTRAINT "neon_tasks_team_id_neon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."neon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_tasks" ADD CONSTRAINT "neon_tasks_project_id_neon_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."neon_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_tasks" ADD CONSTRAINT "neon_tasks_recurrence_rule_id_neon_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."neon_recurrence_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_tasks" ADD CONSTRAINT "neon_tasks_parent_task_id_neon_tasks_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."neon_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_teams" ADD CONSTRAINT "neon_teams_organization_id_neon_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."neon_organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_teams" ADD CONSTRAINT "neon_teams_parent_id_neon_teams_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."neon_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_user_activity_log" ADD CONSTRAINT "neon_user_activity_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "neon_user_profiles" ADD CONSTRAINT "neon_user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_login_attempts_identifier_idx" ON "neon_login_attempts" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_login_attempts_locked_idx" ON "neon_login_attempts" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_dup_group_versions_group_id_idx" ON "magicfolder_duplicate_group_versions" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_duplicate_groups_tenant_id_idx" ON "magicfolder_duplicate_groups" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_duplicate_groups_keep_version_id_idx" ON "magicfolder_duplicate_groups" USING btree ("keep_version_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_object_index_object_id_idx" ON "magicfolder_object_index" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_object_index_text_hash_idx" ON "magicfolder_object_index" USING btree ("text_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_object_tags_object_id_idx" ON "magicfolder_object_tags" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_object_tags_tag_id_idx" ON "magicfolder_object_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_object_versions_object_id_idx" ON "magicfolder_object_versions" USING btree ("object_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_object_versions_sha256_idx" ON "magicfolder_object_versions" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_objects_tenant_id_idx" ON "magicfolder_objects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_objects_owner_id_idx" ON "magicfolder_objects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_objects_status_idx" ON "magicfolder_objects" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_objects_deleted_at_idx" ON "magicfolder_objects" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_tags_tenant_slug_idx" ON "magicfolder_tags" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_uploads_tenant_id_idx" ON "magicfolder_uploads" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_uploads_status_idx" ON "magicfolder_uploads" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "magicfolder_uploads_sha256_idx" ON "magicfolder_uploads" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_memberships_user_id_idx" ON "neon_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_memberships_organization_id_idx" ON "neon_memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_memberships_team_id_idx" ON "neon_memberships" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_memberships_unique" ON "neon_memberships" USING btree ("user_id","organization_id","team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_memberships_role_idx" ON "neon_memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_memberships_is_active_idx" ON "neon_memberships" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_organizations_slug_idx" ON "neon_organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_organizations_name_idx" ON "neon_organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_organizations_is_active_idx" ON "neon_organizations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_projects_user_id_idx" ON "neon_projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_projects_organization_id_idx" ON "neon_projects" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_projects_team_id_idx" ON "neon_projects" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_projects_archived_idx" ON "neon_projects" USING btree ("archived");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_r2_files_object_key_idx" ON "neon_r2_files" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_r2_files_user_id_idx" ON "neon_r2_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_r2_files_upload_timestamp_idx" ON "neon_r2_files" USING btree ("upload_timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_recurrence_rules_user_id_idx" ON "neon_recurrence_rules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_recurrence_rules_organization_id_idx" ON "neon_recurrence_rules" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_recurrence_rules_team_id_idx" ON "neon_recurrence_rules" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_resource_shares_resource_id_idx" ON "neon_resource_shares" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_resource_shares_owner_id_idx" ON "neon_resource_shares" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_resource_shares_shared_with_user_idx" ON "neon_resource_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_resource_shares_shared_with_team_idx" ON "neon_resource_shares" USING btree ("shared_with_team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_resource_shares_shared_with_org_idx" ON "neon_resource_shares" USING btree ("shared_with_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_resource_shares_expires_at_idx" ON "neon_resource_shares" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_resource_shares_unique" ON "neon_resource_shares" USING btree ("resource_type","resource_id","shared_with_user_id","shared_with_team_id","shared_with_organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_security_event_log_action_idx" ON "neon_security_event_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_security_event_log_created_at_idx" ON "neon_security_event_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_security_event_log_identifier_hash_idx" ON "neon_security_event_log" USING btree ("identifier_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_subdomain_config_org_id_idx" ON "neon_subdomain_config" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_subdomain_config_subdomain_idx" ON "neon_subdomain_config" USING btree ("subdomain");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_subdomain_config_is_active_idx" ON "neon_subdomain_config" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_subdomain_config_is_primary_idx" ON "neon_subdomain_config" USING btree ("is_primary","organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_task_history_task_id_idx" ON "neon_task_history" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_task_history_user_id_idx" ON "neon_task_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_task_history_organization_id_idx" ON "neon_task_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_task_history_team_id_idx" ON "neon_task_history" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_tasks_user_id_idx" ON "neon_tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_tasks_organization_id_idx" ON "neon_tasks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_tasks_team_id_idx" ON "neon_tasks" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_tasks_project_id_idx" ON "neon_tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_tasks_status_idx" ON "neon_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_tasks_due_date_idx" ON "neon_tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_tasks_priority_idx" ON "neon_tasks" USING btree ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_teams_organization_id_idx" ON "neon_teams" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_teams_slug_idx" ON "neon_teams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_teams_parent_id_idx" ON "neon_teams" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_teams_unique_slug" ON "neon_teams" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_teams_is_active_idx" ON "neon_teams" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_unlock_tokens_identifier_hash_idx" ON "neon_unlock_tokens" USING btree ("identifier_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_unlock_tokens_expires_at_idx" ON "neon_unlock_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_user_activity_log_user_id_idx" ON "neon_user_activity_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_user_activity_log_action_idx" ON "neon_user_activity_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_user_activity_log_created_at_idx" ON "neon_user_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_user_profiles_email_idx" ON "neon_user_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "neon_user_profiles_role_idx" ON "neon_user_profiles" USING btree ("role");