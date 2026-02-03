# Cloudflare R2 + Neon Integration

**Reference:** [Neon guide – File storage with Cloudflare R2](https://neon.com/docs/guides/cloudflare-r2)

This app stores file metadata in Neon and uses Cloudflare R2 for object storage (presigned uploads, optional public URLs).

## Environment (.env)

Already configured in your `.env`:

- `R2_ACCOUNT_ID` – Cloudflare account ID
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` – R2 API token (Object Read & Write)
- `R2_BUCKET_NAME` – Bucket name (e.g. `axis-attachments`)
- `R2_ENDPOINT` – S3-compatible endpoint (no trailing slash)
- `R2_PUBLIC_BASE_URL` – Public bucket URL for direct file access (see **Enable public access** below).

### Enable public access

1. Open [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → bucket **axis-attachments**.
2. Go to **Settings** → **Public access** (or **Allow public access**).
3. Enable **Allow public access** and note the bucket public URL (e.g. `https://pub-xxxxxxxx.r2.dev`).
4. In `.env`, set:
   ```env
   R2_PUBLIC_BASE_URL=https://pub-xxxxxxxx.r2.dev
   ```
   Use your actual URL from the dashboard; no trailing slash.

**Security:** Public access makes all objects in the bucket readable via URL. For sensitive data, use a private bucket and presigned read URLs instead.

## Database

Metadata is stored in `neon_r2_files` (see `drizzle/0006_r2_files.sql`):

- `object_key` – Key in R2
- `file_url` – Public or presigned URL
- `user_id` – Neon Auth user ID
- `upload_timestamp`

Run migrations: `pnpm db:migrate`

## API

Authenticated endpoints (Neon Auth session required):

1. **POST `/api/v1/storage/presign-upload`**  
   Body: `{ "fileName": "…", "contentType": "…" }`  
   Returns: `{ presignedUrl, objectKey, publicFileUrl }` (use presignedUrl for `PUT` upload).

2. **POST `/api/v1/storage/save-metadata`**  
   Body: `{ "objectKey": "…", "publicFileUrl": "…" }` (optional).  
   Saves a row in `neon_r2_files` after the client has uploaded to R2.

Routes are also exposed via `routes.api.v1.storage.presignUpload()` and `routes.api.v1.storage.saveMetadata()`.

## CORS (client-side uploads)

If the browser uploads directly to R2 via the presigned URL, configure CORS on the R2 bucket (Cloudflare dashboard → R2 → Bucket → Settings → CORS). Example:

```json
[
  {
    "AllowedOrigins": ["https://nexuscanon.com", "http://localhost:3000"],
    "AllowedMethods": ["PUT", "GET"]
  }
]
```

## Flow

1. Client calls `POST /api/v1/storage/presign-upload` with `fileName` and `contentType`.
2. Client `PUT`s the file to `presignedUrl` (same `Content-Type` header).
3. Client calls `POST /api/v1/storage/save-metadata` with `objectKey` and `publicFileUrl` (if any).
4. Query `neon_r2_files` by `user_id` to list the user’s files.
