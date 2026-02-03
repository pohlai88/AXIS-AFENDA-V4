# Vercel Cron Jobs and CRON_SECRET

This project uses [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) defined in `vercel.json`. Each cron endpoint is secured with `CRON_SECRET`.

## Cron endpoints

| Path                                  | Schedule                    | Purpose                                                    |
| ------------------------------------- | --------------------------- | ---------------------------------------------------------- |
| `/api/cron/generate-recurrence`       | `0 2 * * *` (daily 02:00)   | Generate next task occurrences, cleanup overdue            |
| `/api/cron/audit-hash`                | `0 3 * * 0` (Sundays 03:00) | Hash audit: sample object versions, verify SHA-256         |
| `/api/cron/process-magicfolder-queue` | `*/5 * * * *` (every 5 min) | Process one MagicFolder BullMQ job (when REDIS_URL is set) |

## Configure CRON_SECRET on Vercel

Vercel sends `Authorization: Bearer <CRON_SECRET>` when invoking cron endpoints. You must set `CRON_SECRET` in your project’s environment variables so that:

1. Vercel can authenticate its own cron requests.
2. The value is available as `process.env.CRON_SECRET` in your routes.

### Option 1: Vercel Dashboard

1. Open your project on [vercel.com](https://vercel.com) → **Settings** → **Environment Variables**.
2. Add a variable:
   - **Key:** `CRON_SECRET`
   - **Value:** A long random string (e.g. 32+ characters). Generate with:  
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - **Environments:** Production (and Preview if you run crons there).
3. Save. Redeploy so new deployments use the variable.

### Option 2: Vercel CLI

```bash
# From project root (after vercel link)
vercel env add CRON_SECRET production
# Paste the secret when prompted; use a 32+ char random string.
```

To add for preview as well:

```bash
vercel env add CRON_SECRET preview
```

### Local development

- In `.env` or `.env.local`, set:
  - `CRON_SECRET=your-secret-at-least-32-chars`
- Use the same value as in Vercel if you want to call cron routes locally with the same secret.

## Authorization

Cron routes accept **either**:

- **`Authorization: Bearer <CRON_SECRET>`** — used by Vercel Cron.
- **`x-cron-secret: <CRON_SECRET>`** — for manual or external schedulers (e.g. curl, GitHub Actions).

Example (manual trigger):

```bash
curl -X POST "https://your-app.vercel.app/api/cron/generate-recurrence" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
# or
curl -X POST "https://your-app.vercel.app/api/cron/generate-recurrence" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

## Verifying

- **Health (no auth):**  
  `GET /api/cron/generate-recurrence` (and the other cron paths) returns a JSON health payload with `status: "ok"` and lists required headers.
- **Validation script:**  
  `pnpm run validate:env-magicfolder-cron` checks that `CRON_SECRET` is set (and length ≥16) and that `vercel.json` crons are present.

## Vercel project link

This repo is linked to the Vercel project **afenda** (see `.vercel/project.json`). To re-link or switch project:

```bash
vercel link
# Choose your team, then select project "afenda" (or create it).
```

After linking, set `CRON_SECRET` in Vercel (Dashboard → Project → Settings → Environment Variables, or `vercel env add CRON_SECRET production`).

## References

- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Secure cron with CRON_SECRET](https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs)
- Project: `vercel.json` (crons), `lib/server/api/cron-auth.ts` (validation)
