-- MagicFolder uploads: pre-allocate objectId and versionId at presign for canonical key contract
ALTER TABLE "magicfolder_uploads" ADD COLUMN IF NOT EXISTS "object_id" uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE "magicfolder_uploads" ADD COLUMN IF NOT EXISTS "version_id" uuid NOT NULL DEFAULT gen_random_uuid();
