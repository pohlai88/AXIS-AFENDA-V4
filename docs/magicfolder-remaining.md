# MagicFolder — Remaining to Implement

All previously listed optional items are **implemented**. Summary below.

**UI/UX (5-phase plan):** Definition lock (no hardcoded UI in feature pages — only layout blocks + shadcn primitives). Registry includes all UI/API routes and capabilities (`canUpload`, `hasFTS`, etc.). Four canonical blocks: MagicfolderToolbar, MagicfolderDataView, MagicfolderDocRow/DocCard, MagicfolderEmptyState. Single FilterBar (status, docType, hasTags, tagId, sort). All pages (Landing, Inbox, Document detail, Duplicates, Search, Collections, Unsorted) compose blocks only. Upload flow: Dialog with file input, progress list, result summary (presign → PUT → ingest). See [magicfolder-ui-audit-patterns.md](magicfolder-ui-audit-patterns.md), [magicfolder-ux-spec.md](magicfolder-ux-spec.md). No orphan API routes; every registry route is used by UI or cron.

**Tesseract.js:** Installed; image OCR with multi-language (`TESSERACT_LANG`), confidence threshold, optional sharp preprocessing, 30s timeout. See [magicfolder-tesseract-evaluation.md](magicfolder-tesseract-evaluation.md). **Tesseract vs Google OCR:** Accuracy and efficiency comparison in [magicfolder-ocr-tesseract-vs-google.md](magicfolder-ocr-tesseract-vs-google.md).

---

## 1. Implemented (summary)

| Area                       | Status | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thumbnail generation**   | ✅      | [lib/server/magicfolder/thumbs.ts](lib/server/magicfolder/thumbs.ts): sharp for images; **PDF first-page** via pdfjs-dist + canvas → thumb/1.jpg. Enqueued after ingest. GET objects/[id]/thumb-url?page=1; doc detail shows thumb.                                                                                                                                                                                                       |
| **PDF first-page thumb**   | ✅      | Dependencies: **pdfjs-dist** (Mozilla PDF.js, no system deps), **canvas** (node-canvas for rendering). Alternative pdf2pic would require GraphicsMagick on the system. If canvas fails to build, PDF thumb is skipped gracefully.                                                                                                                                                                                                         |
| **Apply suggestedTags**    | ✅      | After OCR, `findOrCreateTagByName` + `addTagToObject` for each suggested tag. Tags created if missing. Doc detail shows "Auto-applied from text: …".                                                                                                                                                                                                                                                                                      |
| **Async job queue**        | ✅      | [lib/server/magicfolder/jobs.ts](lib/server/magicfolder/jobs.ts): in-process by default; **BullMQ + Redis** when `REDIS_URL` is set. Enqueue: ocr, preview, thumb. Processing: in-process immediately, or via cron when Redis.                                                                                                                                                                                                            |
| **Persistent queue**       | ✅      | **Why ioredis:** BullMQ requires a Redis protocol client. [ioredis](https://ioredis.com/) is the standard Node client (TLS, Cluster/Sentinel, high performance; [guide](https://ioredis.com/category/guide/)). HTTP clients like @upstash/redis don’t fit BullMQ’s connection model; ioredis + REDIS_URL (e.g. Upstash `rediss://`) works. Redis via Docker or Upstash; `pnpm add bullmq ioredis`. Process via cron or a separate worker. |
| **Hash audit**             | ✅      | [lib/server/magicfolder/hash-audit.ts](lib/server/magicfolder/hash-audit.ts): sample versions, re-download from R2, verify SHA-256. GET `/api/v1/magicfolder/audit/hash?sample=20`.                                                                                                                                                                                                                                                       |
| **Hash audit cron**        | ✅      | **Aligned with existing Vercel cron:** POST `/api/cron/audit-hash` (x-cron-secret); added to `vercel.json` crons: `0 3 * * 0` (Sunday 3 AM UTC). Same auth and GET health pattern as `generate-recurrence`.                                                                                                                                                                                                                               |
| **Tesseract improvements** | ✅      | Multi-language (`TESSERACT_LANG`, default `eng`); confidence threshold (store `lowConfidence` + `confidence` in extractedFields if &lt; 60); optional sharp resize (max 2000px), normalise, grayscale before recognize; 30s timeout; multi-pass PSM (3, 6, 11) when confidence/short text.                                                                                                                                                |
| **Python OCR fallback**    | ✅      | When `OCR_PYTHON_FALLBACK=1`, on low Tesseract confidence/short text: run PaddleOCR then EasyOCR via [scripts/ocr-fallback.py](scripts/ocr-fallback.py). Optional: `pip install -r scripts/requirements-ocr.txt`. See [magicfolder-ocr-python-fallback.md](magicfolder-ocr-python-fallback.md).                                                                                                                                           |
| **Preview generation**     | ✅      | Copy source → preview key; enqueued after ingest.                                                                                                                                                                                                                                                                                                                                                                                         |
| **FTS**                    | ✅      | Migration 0011: search_vector tsvector + trigger. List uses plainto_tsquery when search_vector set.                                                                                                                                                                                                                                                                                                                                       |
| **suggestTags**            | ✅      | Heuristics (invoice, contract, Q1–Q4, tax, year); stored in extractedFields; auto-applied via findOrCreateTagByName + addTagToObject.                                                                                                                                                                                                                                                                                                     |
| **Routes**                 | ✅      | objectThumbUrl(id, page), auditHash(). Cron: `routes.api.cron.auditHash()`, `routes.api.cron.processMagicfolderQueue()`.                                                                                                                                                                                                                                                                                                                  |

---

## 2. Optional / future

| Item               | Notes                                                                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Worker process** | When using Redis, you can run a dedicated worker process (e.g. `node scripts/magicfolder-worker.js`) instead of the cron-driven processor. Cron `/api/cron/process-magicfolder-queue` runs every 5 min when configured; disable in `vercel.json` if not using Redis. |

---

## 3. Migrations

- **0011_magicfolder_object_index_fts.sql** — FTS search_vector. Run `pnpm db:migrate` (or `db:push`).

---

## 4. Environment

- **TESSERACT_LANG** — Optional; default `eng`. Use `eng+deu` etc. for multi-language OCR.
- **OCR_PYTHON_FALLBACK** — Optional; when `1`/`true`/`yes`, run PaddleOCR + EasyOCR fallback when Tesseract is weak (requires Python + `scripts/requirements-ocr.txt`).
- **REDIS_URL** — Optional. When set, MagicFolder jobs (OCR, preview, thumb) are enqueued to BullMQ; process via Vercel Cron `POST /api/cron/process-magicfolder-queue` (every 5 min) or a separate worker.
- **CRON_SECRET** — Required for cron routes (`x-cron-secret` header). Used by generate-recurrence, audit-hash, process-magicfolder-queue.

---

## 5. Env and cron validation

- **Local:** Run `pnpm run validate:env-magicfolder-cron` to check REDIS_URL, CRON_SECRET, TESSERACT_LANG and list crons from `vercel.json`.
- **Vercel:** Ensure CRON_SECRET (and REDIS_URL if using BullMQ) are set in the project env. Link first: `vercel link`, then `vercel env ls`. Crons in `vercel.json` are deployed with the project; Vercel invokes them on the configured schedules and sends `x-cron-secret` when CRON_SECRET is set.

**Full checklist of what you need to provide:** [magicfolder-pending-validation.md](magicfolder-pending-validation.md)
