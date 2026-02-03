# MagicFolder & cron — What you need to provide

Use this checklist so nothing is left for you to provide or run.

---

## 1. Environment (you provide)

| Item                    | Where                                        | Required?        | What to do                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CRON_SECRET**         | `.env` and **Vercel** project env            | **Yes** for cron | Set a long random string (e.g. ≥32 chars). Cron routes (`generate-recurrence`, `audit-hash`, `process-magicfolder-queue`) need `x-cron-secret: <CRON_SECRET>`. Without it they return 401. |
| **REDIS_URL**           | `.env` and **Vercel** (if using queue)       | Optional         | If you use Upstash: paste `rediss://default:PASSWORD@ENDPOINT.upstash.io:6379` from Upstash dashboard. If not set, MagicFolder uses in-process queue (no Redis).                           |
| **TESSERACT_LANG**      | `.env`                                       | Optional         | Default `eng` is set. Use e.g. `eng+deu` for multi-language OCR.                                                                                                                           |
| **OCR Python fallback** | `.env` (OCR_PYTHON_FALLBACK, OCR_PYTHON_EXE) | Optional         | Only if you use PaddleOCR+EasyOCR fallback. Run `pnpm run validate:ocr-setup` to check script and Python.                                                                                  |

**Validate locally:** `pnpm run validate:env-magicfolder-cron` (cron/Redis). For OCR fallback: `pnpm run validate:ocr-setup`.

---

## 2. Database migration (you run once)

| Item                            | Command                             | When                                                               |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| **FTS search** (migration 0011) | `pnpm db:migrate` or `pnpm db:push` | Once, so MagicFolder list search uses `search_vector` (full-text). |

If you already run `db:push` or `db:migrate` regularly, 0011 may be applied. If not, run one of the commands above.

---

## 3. Vercel (you do once per project)

| Item                  | What to do                                                                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Link project**      | `vercel link` (choose team and project, e.g. nexuscanon-axis).                                                                                  |
| **Set env in Vercel** | In Vercel → Project → Settings → Environment Variables, add **CRON_SECRET** (and **REDIS_URL** if you use BullMQ).                              |
| **Confirm crons**     | Crons are defined in `vercel.json`; they run after deploy. No extra step except ensuring CRON_SECRET is set so Vercel can call the cron routes. |

---

## 4. Nothing else pending from MagicFolder/cron

- **Code:** Implemented (thumbnails, PDF thumb, BullMQ/ioredis, hash audit cron, Tesseract defaults, validation script).
- **Secrets:** Only **CRON_SECRET** (and optionally **REDIS_URL**) need to be set by you; no other new secrets.
- **Migrations:** Only **0011** (FTS); run `pnpm db:migrate` or `pnpm db:push` if you haven’t.

---

## Quick checklist (copy and tick)

- [ ] **CRON_SECRET** set in `.env` (and in Vercel env)
- [ ] **REDIS_URL** set in `.env` (and in Vercel) *only if* you use BullMQ/Upstash
- [ ] `pnpm run validate:env-magicfolder-cron` passes / shows what’s missing
- [ ] `pnpm db:migrate` or `pnpm db:push` run (for FTS migration 0011)
- [ ] `vercel link` done and **CRON_SECRET** (and **REDIS_URL** if needed) set in Vercel project env
- [ ] (Optional) If using OCR Python fallback: `pnpm run validate:ocr-setup` passes
