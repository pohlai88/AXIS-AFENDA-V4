-- MagicFolder: object_index for extracted text and full-text search
CREATE TABLE IF NOT EXISTS "magicfolder_object_index" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "object_id" uuid NOT NULL REFERENCES "magicfolder_objects"("id") ON DELETE CASCADE,
  "extracted_text" text,
  "extracted_fields" jsonb,
  "updated_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "magicfolder_object_index_object_id_idx" ON "magicfolder_object_index" USING btree ("object_id");
