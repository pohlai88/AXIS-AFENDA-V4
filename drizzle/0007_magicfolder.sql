-- MagicFolder: document-first objects, versions, uploads, duplicate groups
CREATE TABLE IF NOT EXISTS "magicfolder_objects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" varchar(255) NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE,
  "current_version_id" uuid,
  "title" varchar(500),
  "doc_type" varchar(50) DEFAULT 'other' NOT NULL,
  "status" varchar(50) DEFAULT 'inbox' NOT NULL,
  "deleted_at" timestamp with time zone,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "magicfolder_objects_tenant_id_idx" ON "magicfolder_objects" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "magicfolder_objects_owner_id_idx" ON "magicfolder_objects" USING btree ("owner_id");
CREATE INDEX IF NOT EXISTS "magicfolder_objects_status_idx" ON "magicfolder_objects" USING btree ("status");
CREATE INDEX IF NOT EXISTS "magicfolder_objects_deleted_at_idx" ON "magicfolder_objects" USING btree ("deleted_at");

CREATE TABLE IF NOT EXISTS "magicfolder_object_versions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "object_id" uuid NOT NULL REFERENCES "magicfolder_objects"("id") ON DELETE CASCADE,
  "version_no" integer NOT NULL,
  "r2_key" text NOT NULL,
  "mime_type" varchar(255) NOT NULL,
  "size_bytes" integer NOT NULL,
  "sha256" varchar(64) NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "magicfolder_object_versions_object_id_idx" ON "magicfolder_object_versions" USING btree ("object_id");
CREATE INDEX IF NOT EXISTS "magicfolder_object_versions_sha256_idx" ON "magicfolder_object_versions" USING btree ("sha256");

ALTER TABLE "magicfolder_objects" ADD CONSTRAINT "magicfolder_objects_current_version_id_fkey" FOREIGN KEY ("current_version_id") REFERENCES "magicfolder_object_versions"("id") ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS "magicfolder_uploads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" varchar(255) NOT NULL,
  "owner_id" uuid NOT NULL REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE,
  "filename" varchar(500) NOT NULL,
  "mime_type" varchar(255) NOT NULL,
  "size_bytes" integer NOT NULL,
  "sha256" varchar(64) NOT NULL,
  "r2_key_quarantine" text NOT NULL,
  "status" varchar(50) DEFAULT 'presigned' NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "magicfolder_uploads_tenant_id_idx" ON "magicfolder_uploads" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "magicfolder_uploads_status_idx" ON "magicfolder_uploads" USING btree ("status");
CREATE INDEX IF NOT EXISTS "magicfolder_uploads_sha256_idx" ON "magicfolder_uploads" USING btree ("sha256");

CREATE TABLE IF NOT EXISTS "magicfolder_duplicate_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" varchar(255) NOT NULL,
  "reason" varchar(20) NOT NULL,
  "keep_version_id" uuid REFERENCES "magicfolder_object_versions"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "magicfolder_duplicate_groups_tenant_id_idx" ON "magicfolder_duplicate_groups" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "magicfolder_duplicate_groups_keep_version_id_idx" ON "magicfolder_duplicate_groups" USING btree ("keep_version_id");

CREATE TABLE IF NOT EXISTS "magicfolder_duplicate_group_versions" (
  "group_id" uuid NOT NULL REFERENCES "magicfolder_duplicate_groups"("id") ON DELETE CASCADE,
  "version_id" uuid NOT NULL REFERENCES "magicfolder_object_versions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("group_id", "version_id")
);

CREATE INDEX IF NOT EXISTS "magicfolder_dup_group_versions_group_id_idx" ON "magicfolder_duplicate_group_versions" USING btree ("group_id");
