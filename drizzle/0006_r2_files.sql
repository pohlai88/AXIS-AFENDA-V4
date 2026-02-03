-- Cloudflare R2 file metadata (Neon guide: https://neon.com/docs/guides/cloudflare-r2)
CREATE TABLE IF NOT EXISTS "neon_r2_files" (
  "id" serial PRIMARY KEY NOT NULL,
  "object_key" text NOT NULL UNIQUE,
  "file_url" text NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE,
  "upload_timestamp" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "neon_r2_files_object_key_idx" ON "neon_r2_files" USING btree ("object_key");
CREATE INDEX IF NOT EXISTS "neon_r2_files_user_id_idx" ON "neon_r2_files" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "neon_r2_files_upload_timestamp_idx" ON "neon_r2_files" USING btree ("upload_timestamp");
