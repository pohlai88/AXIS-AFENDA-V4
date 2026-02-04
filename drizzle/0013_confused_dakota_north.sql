CREATE TABLE "magicfolder_saved_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"view_mode" varchar(50) DEFAULT 'cards' NOT NULL,
	"sort_by" varchar(50) DEFAULT 'createdAt' NOT NULL,
	"sort_order" varchar(10) DEFAULT 'desc' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magicfolder_tenant_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"document_types" jsonb DEFAULT '[{"value":"invoice","label":"Invoices","enabled":true},{"value":"contract","label":"Contracts","enabled":true},{"value":"receipt","label":"Receipts","enabled":true},{"value":"other","label":"Other","enabled":true}]'::jsonb NOT NULL,
	"status_workflow" jsonb DEFAULT '[{"value":"inbox","label":"Inbox","color":"#3b82f6","enabled":true},{"value":"active","label":"Active","color":"#22c55e","enabled":true},{"value":"archived","label":"Archived","color":"#6b7280","enabled":true},{"value":"deleted","label":"Deleted","color":"#ef4444","enabled":true}]'::jsonb NOT NULL,
	"enable_ai_suggestions" boolean DEFAULT true NOT NULL,
	"enable_public_shares" boolean DEFAULT true NOT NULL,
	"max_file_size_mb" integer DEFAULT 100 NOT NULL,
	"allowed_file_types" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magicfolder_tenant_settings_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "magicfolder_user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"default_view" varchar(50) DEFAULT 'cards' NOT NULL,
	"items_per_page" integer DEFAULT 20 NOT NULL,
	"default_sort" varchar(50) DEFAULT 'createdAt-desc' NOT NULL,
	"show_file_extensions" boolean DEFAULT true NOT NULL,
	"show_thumbnails" boolean DEFAULT true NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"quick_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "magicfolder_saved_views" ADD CONSTRAINT "magicfolder_saved_views_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "magicfolder_user_preferences" ADD CONSTRAINT "magicfolder_user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "magicfolder_saved_views_name_unique_per_user" ON "magicfolder_saved_views" USING btree ("tenant_id","user_id","name");--> statement-breakpoint
CREATE INDEX "magicfolder_saved_views_tenant_id_idx" ON "magicfolder_saved_views" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicfolder_saved_views_user_id_idx" ON "magicfolder_saved_views" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "magicfolder_tenant_settings_tenant_id_idx" ON "magicfolder_tenant_settings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicfolder_user_preferences_unique" ON "magicfolder_user_preferences" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "magicfolder_user_preferences_tenant_id_idx" ON "magicfolder_user_preferences" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "magicfolder_user_preferences_user_id_idx" ON "magicfolder_user_preferences" USING btree ("user_id");