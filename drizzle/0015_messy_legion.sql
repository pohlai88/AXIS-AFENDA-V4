-- Align schema with existing DB: idempotent steps (safe if 0007/0011 already applied)
ALTER TABLE "magicfolder_tenant_settings" ALTER COLUMN "allowed_file_types" SET DEFAULT '{}'::text[];
--> statement-breakpoint
ALTER TABLE "magicfolder_object_index" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;
--> statement-breakpoint
-- keep_version_id FK already added in 0007; skip if present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'magicfolder_duplicate_groups'::regclass
    AND conname LIKE '%keep_version%'
  ) THEN
    ALTER TABLE "magicfolder_duplicate_groups"
      ADD CONSTRAINT "magicfolder_duplicate_groups_keep_version_id_magicfolder_object_versions_id_fk"
      FOREIGN KEY ("keep_version_id") REFERENCES "public"."magicfolder_object_versions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;