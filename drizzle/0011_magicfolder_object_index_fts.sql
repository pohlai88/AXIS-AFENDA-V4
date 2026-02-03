-- MagicFolder: add tsvector for full-text search on object_index
ALTER TABLE "magicfolder_object_index"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Backfill and keep in sync via trigger
UPDATE "magicfolder_object_index"
SET "search_vector" = to_tsvector('english', coalesce("extracted_text", ''))
WHERE "search_vector" IS NULL;

CREATE INDEX IF NOT EXISTS "magicfolder_object_index_search_vector_idx"
  ON "magicfolder_object_index" USING gin ("search_vector");

-- Trigger to update search_vector on insert/update
CREATE OR REPLACE FUNCTION magicfolder_object_index_search_vector_trigger()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.extracted_text, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS magicfolder_object_index_search_vector_trg ON "magicfolder_object_index";
CREATE TRIGGER magicfolder_object_index_search_vector_trg
  BEFORE INSERT OR UPDATE OF "extracted_text"
  ON "magicfolder_object_index"
  FOR EACH ROW
  EXECUTE FUNCTION magicfolder_object_index_search_vector_trigger();
