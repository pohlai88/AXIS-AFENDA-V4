## MagicFolder domain (`magicfolder`)

### Purpose

Document-first ingest with client-side SHA-256, presigned R2 uploads, quarantine → canonical keys, exact duplicate detection, and "Keep Best" flow.

### Lineage

- **URLs**: `lib/routes.ts` (`routes.ui.magicfolder.*`, `routes.api.v1.magicfolder.*`)
- **UI routes**: `app/(app)/app/(magicfolder)/*`
- **API routes (v1)**: `app/api/v1/(magicfolder)/magicfolder/*`
- **DB schema**: `lib/server/db/schema/index.ts` (magicfolder_*), `drizzle/*.sql`
- **R2 keys**: `lib/server/r2/magicfolder-keys.ts`

### Flow

1. Client computes SHA-256 (Web Crypto) → `POST /api/v1/magicfolder/presign` with `{ filename, mimeType, sizeBytes, sha256 }`
2. Server returns `{ uploadId, objectId, versionId, key, url, expiresAt }`; client PUT to R2
3. Client calls `POST /api/v1/magicfolder/ingest` with `{ uploadId }`; server copies quarantine → canonical, creates object/version, runs exact-dupe check
4. Duplicates page: list groups → "Keep Best" → `POST /api/v1/magicfolder/keep-best` with `{ groupId, versionId }`

### Checklist

| Feature          | UI (page)                                       | API                                        | DB tables                                                              | Status |
| ---------------- | ----------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------- | ------ |
| Presign          | —                                               | `POST /api/v1/magicfolder/presign`         | `magicfolder_uploads`                                                  | ✅      |
| Ingest           | —                                               | `POST /api/v1/magicfolder/ingest`          | `magicfolder_objects`, `magicfolder_object_versions`, duplicate groups | ✅      |
| List (Inbox)     | `app/(app)/app/magicfolder/inbox/page.tsx`      | `GET /api/v1/magicfolder?status=inbox`     | —                                                                      | ✅      |
| Duplicate groups | `app/(app)/app/magicfolder/duplicates/page.tsx` | `GET /api/v1/magicfolder/duplicate-groups` | —                                                                      | ✅      |
| Keep Best        | Duplicates page                                 | `POST /api/v1/magicfolder/keep-best`       | `magicfolder_duplicate_groups.keep_version_id`                         | ✅      |
| Registry         | All UI routes + API routes + capabilities       | `lib/domains/magicfolder/registry.ts`      | —                                                                      | ✅      |

### Registry (Phase 1)

- **UI routes:** landing, inbox, duplicates, unsorted, search, collections, documentById.
- **API routes:** presign, ingest, keepBest, list, duplicateGroups, bulk, objectById, objectSourceUrl, objectPreviewUrl, objectThumbUrl, objectTags, tags, auditHash.
- **Capabilities:** canUpload, canBulkTag, canBulkArchive, canResolveDuplicates, hasFTS, hasPreview, hasThumbs (drive toolbar/empty-state affordances).
