-- MagicFolder: tags and object_tags
CREATE TABLE IF NOT EXISTS "magicfolder_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "created_at" timestamp with time zone DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS "magicfolder_tags_tenant_slug_idx" ON "magicfolder_tags" USING btree ("tenant_id", "slug");

CREATE TABLE IF NOT EXISTS "magicfolder_object_tags" (
  "object_id" uuid NOT NULL REFERENCES "magicfolder_objects"("id") ON DELETE CASCADE,
  "tag_id" uuid NOT NULL REFERENCES "magicfolder_tags"("id") ON DELETE CASCADE,
  PRIMARY KEY ("object_id", "tag_id")
);

CREATE INDEX IF NOT EXISTS "magicfolder_object_tags_object_id_idx" ON "magicfolder_object_tags" USING btree ("object_id");
CREATE INDEX IF NOT EXISTS "magicfolder_object_tags_tag_id_idx" ON "magicfolder_object_tags" USING btree ("tag_id");
