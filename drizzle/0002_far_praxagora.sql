CREATE TABLE "login_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"locked_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
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
CREATE TABLE "organizations" (
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
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "resource_shares" (
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
CREATE TABLE "teams" (
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
ALTER TABLE "projects" ADD COLUMN "client_generated_id" varchar(255);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sync_status" varchar(20) DEFAULT 'synced' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sync_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "client_generated_id" varchar(255);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sync_status" varchar(20) DEFAULT 'synced' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sync_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_shares" ADD CONSTRAINT "resource_shares_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_shares" ADD CONSTRAINT "resource_shares_shared_with_user_id_users_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_shares" ADD CONSTRAINT "resource_shares_shared_with_team_id_teams_id_fk" FOREIGN KEY ("shared_with_team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_shares" ADD CONSTRAINT "resource_shares_shared_with_organization_id_organizations_id_fk" FOREIGN KEY ("shared_with_organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_parent_id_teams_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "login_attempts_identifier_idx" ON "login_attempts" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "login_attempts_locked_idx" ON "login_attempts" USING btree ("locked_until");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_organization_id_idx" ON "memberships" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "memberships_team_id_idx" ON "memberships" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "memberships_unique" ON "memberships" USING btree ("user_id","organization_id","team_id");--> statement-breakpoint
CREATE INDEX "memberships_role_idx" ON "memberships" USING btree ("role");--> statement-breakpoint
CREATE INDEX "memberships_is_active_idx" ON "memberships" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "organizations_is_active_idx" ON "organizations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "resource_shares_resource_id_idx" ON "resource_shares" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "resource_shares_owner_id_idx" ON "resource_shares" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "resource_shares_shared_with_user_idx" ON "resource_shares" USING btree ("shared_with_user_id");--> statement-breakpoint
CREATE INDEX "resource_shares_shared_with_team_idx" ON "resource_shares" USING btree ("shared_with_team_id");--> statement-breakpoint
CREATE INDEX "resource_shares_shared_with_org_idx" ON "resource_shares" USING btree ("shared_with_organization_id");--> statement-breakpoint
CREATE INDEX "resource_shares_expires_at_idx" ON "resource_shares" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "resource_shares_unique" ON "resource_shares" USING btree ("resource_type","resource_id","shared_with_user_id","shared_with_team_id","shared_with_organization_id");--> statement-breakpoint
CREATE INDEX "teams_organization_id_idx" ON "teams" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "teams_slug_idx" ON "teams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "teams_parent_id_idx" ON "teams" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "teams_unique_slug" ON "teams" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "teams_is_active_idx" ON "teams" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "projects_client_generated_id_idx" ON "projects" USING btree ("client_generated_id");--> statement-breakpoint
CREATE INDEX "projects_sync_status_idx" ON "projects" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "projects_last_synced_at_idx" ON "projects" USING btree ("last_synced_at");--> statement-breakpoint
CREATE INDEX "tasks_client_generated_id_idx" ON "tasks" USING btree ("client_generated_id");--> statement-breakpoint
CREATE INDEX "tasks_sync_status_idx" ON "tasks" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "tasks_last_synced_at_idx" ON "tasks" USING btree ("last_synced_at");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_generated_id_unique" UNIQUE("client_generated_id");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_client_generated_id_unique" UNIQUE("client_generated_id");