# MagicToDo MVP — Setup & First Run

## Overview
MagicToDo is an individual-first, minimal task management feature integrated into the AFENDA **AppShell** (`/app/*`). This MVP includes:

- **Contracts + schema**: Task/Project + recurrence rules in `lib/contracts/tasks.ts`; DB schema in `lib/server/db/schema/index.ts`.
- **API**: `/api/v1/tasks` CRUD route handlers in `app/api/v1/tasks/*` using tenancy (`x-user-id`) and the standard response envelope.
- **UI**: Quick-add input + list view with basic status filtering in `app/(app)/app/tasks/page.tsx`.
- **State**: Zustand store in `lib/client/store/tasks.ts` (all API calls require `userId` input; no hardcoded IDs).
- **AppShell integration**: Navigation + auth boundary enforced by `app/(app)/layout.tsx`.

---

## Quick Start (Local Dev)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Start Postgres (Docker)
```bash
docker-compose up -d
```
Postgres runs on `localhost:5432` with:
- User: `postgres`
- Password: `postgres`
- Database: `magictodo`

### 3. Setup Database
Create `.env.local`:
```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/magictodo
```

Generate & push migrations:
```bash
pnpm db:generate
pnpm db:push
```

### 4. Start Dev Server
```bash
pnpm dev
```
Open `http://localhost:3000/app`. If you’re not authenticated, the AppShell will redirect you to `/login`. Once logged in, use the AppShell sidebar to navigate to **Tasks** (route: `/app/tasks`).

---

## Testing the MVP

### Quick-Add Task
1. The quick-add input auto-focuses on page load.
2. Type: `"tomorrow 9am call with Bob"` (NL parsing is future work; today it’s treated as the title).
3. Press Enter → task appears in list.

### Toggle Status
- Click circle icon to mark done/todo.
- Updates API automatically.

### Filter Tasks
- Use tabs: All / To Do / Done.

### Delete Task
- Click trash icon → removed from list & DB.

---

## Architecture Highlights

### Individual-First Tenancy
All task data is scoped by the **primary tenant boundary**: `x-user-id`.
Scaling path (future) is modeled in `lib/contracts/tenancy.ts` via optional `x-org-id` / `x-team-id`.

### Anti-drift “sources of truth” (read this first)
To avoid docs drifting from implementation, treat these as canonical:

- **Agent guardrails**: `AGENT.md` (includes “App-shell integration (required for all `/app/*` features)”).
- **AppShell integration notes**: `APPSHELL-INTEGRATION.md` (Tasks/MagicToDo integration patterns).
- **Routes**: `lib/routes.ts` (prefer `routes.app.tasks()` instead of hardcoding `"/app/tasks"`).
- **Auth + tenancy**: `app/(app)/layout.tsx` (server auth boundary), `app/api/v1/me/route.ts` (session-backed “who am I”).
- **Client auth propagation**: `lib/client/hooks/use-auth.ts` (fetches `/api/v1/me`), then client requests pass `x-user-id`.
- **Server data access**: `lib/server/db/queries/tasks.ts` (queries enforce `userId` filter).

### File Structure
```
lib/
├── contracts/
│   ├── tasks.ts                ← Task/Project/recurrence API contracts
│   └── tenancy.ts              ← Tenancy model + header parsing helper
├── client/
│   ├── hooks/use-auth.ts       ← Fetches `/api/v1/me` for user context
│   └── store/tasks.ts          ← Zustand store; API calls accept `userId`
├── server/
│   ├── api/response.ts         ← Standard `{ data, error }` envelope helpers
│   └── db/
│       ├── client.ts   ← getDb() singleton
│       ├── schema/index.ts     ← Drizzle tables + relations
│       └── queries/tasks.ts    ← CRUD + history logging (scoped by userId)
│   └── scheduler/recurrence.ts ← Recurrence generator + overdue cleanup
app/
├── api/v1/me/route.ts             ← Returns `{ auth, tenant, requestId }`
├── api/v1/tasks/route.ts          ← GET/POST
├── api/v1/tasks/[id]/route.ts     ← PATCH/DELETE
├── api/cron/generate-recurrence/  ← Scheduler trigger (protected by `x-cron-secret`)
└── (app)/
    ├── layout.tsx                 ← AppShell + server-side auth gate + sidebar nav
    └── app/tasks/page.tsx         ← Tasks UI (client)
```

### API Pattern
All endpoints return a consistent envelope (helpers in `lib/server/api/response.ts`):
```json
// Success
{ "data": { /* task */ }, "error": null }

// Failure
{ "data": null, "error": { "message": "...", "code": "..." } }
```

---

## Background Scheduler

### How Recurring Tasks Work
1. User creates task with recurrence rule (e.g., "repeat daily until Jan 2027").
2. Each night at 2 AM UTC, `/api/cron/generate-recurrence` runs (Vercel Cron via `vercel.json`).
3. Scheduler code lives in `lib/server/scheduler/recurrence.ts` and is responsible for generating occurrences and logging history events (`auto_generated`, `auto_cancelled_overdue`).

Note: treat scheduler behavior as **implementation-defined**; verify with runtime tests before relying on it in production.

### Manual Scheduler Trigger
Test locally:
```bash
curl -X POST http://localhost:3000/api/cron/generate-recurrence \
  -H "x-cron-secret: dev-secret-key"
```

### Configuration
- **Schedule**: `0 2 * * *` (2 AM UTC daily) — edit in `vercel.json`
- **Secret**: Set `CRON_SECRET=dev-secret-key` in `.env.local` for local testing
- **Limit**: Generates up to 100 occurrences per run (batch-safe)

### History Tracking
Task history logs all auto-generated and auto-cancelled events:
```json
{
  "action": "auto_generated",
  "previousValues": { "parentTaskId": "..." }
}
```

---

## Next Steps (Week 2+)

1. **NL Parser**: Integrate date/priority parsing in quick-add ("tomorrow 9am").
2. **Scheduler Testing**: Run `pnpm dev` + trigger `/api/cron/generate-recurrence` locally.
3. **Notifications**: Email/Telegram reminders (optional).
4. **Sync**: Offline mode + conflict resolution.
5. **Mobile**: Responsive fixes + PWA install.
6. **Metrics**: DAU/WAU, completion rates, inbox health.

---

## Commands

```bash
# Development
pnpm dev                # Start Next.js dev server
pnpm typecheck         # TypeScript check
pnpm lint              # ESLint

# Database
pnpm db:generate       # Generate migrations
pnpm db:push           # Push schema to DB
pnpm db:migrate        # Run pending migrations
pnpm db:studio         # Open Drizzle Studio GUI

# Docker
docker-compose up -d   # Start Postgres
docker-compose down    # Stop services
docker-compose logs    # View logs

# Build
pnpm build             # Production build
pnpm start             # Run production server
```

---

## Troubleshooting

**DB Connection Error**
```bash
docker-compose up -d    # Ensure Postgres is running
# Check: docker ps
```

**TypeScript Errors**
```bash
pnpm typecheck          # See full list of issues
```

**Build Fails**
```bash
pnpm clean              # Remove .next/
pnpm build              # Rebuild
```

---

## License & Tenancy Rules

- User ID (`x-user-id`) is **required** on all API calls.
- Data is **isolated per user**; no org/team logic yet.
- All DB queries enforce `userId` filter (see `lib/server/db/queries/tasks.ts`).

Enjoy building!
