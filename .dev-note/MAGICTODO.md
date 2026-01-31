# MagicToDo MVP — ✅ PRIORITY 1 COMPLETE

## Overview

MagicToDo is an individual-first, minimal task management feature integrated into the AFENDA **AppShell** (`/app/*`).

**✅ Priority 1 Complete** - Advanced features implemented:

- **✅ Natural Language Parser**: Smart parsing of dates, priorities, and tags
- **✅ Task Details Modal**: Full-featured task editing interface
- **✅ Mobile-First Design**: Optimized for all device sizes

## 🎯 Implementation Status

### ✅ Completed Features

- **Task CRUD Operations**: Create, read, update, delete tasks
- **Natural Language Processing**: Parse "tomorrow 9am call with Bob" → structured data
- **Real-time Preview**: Shows parsed data before task creation
- **Task Details Modal**: Click any task for full editing capabilities
- **Authentication**: Proper user-scoped data access via `x-user-id` header
- **Quick-add UI**: Auto-focused input with NL parsing feedback
- **Status Management**: Toggle between todo/done with visual feedback
- **Filtering**: All/To Do/Done tabs
- **Priority System**: Low/Medium/High/Urgent with visual badges
- **Task History**: Complete audit trail for all task operations
- **AppShell Integration**: Sidebar navigation, auth boundaries, responsive layout
- **Database Schema**: Full Drizzle schema with proper indexing and relations
- **API Contracts**: Comprehensive Zod schemas for request/response validation
- **Background Scheduler**: Recurrence generation and overdue cleanup
- **Cache Invalidation**: Proper tag-based cache management
- **Mobile Optimization**: Touch-friendly, responsive design

### 🚧 Missing/Partial Features

- **Recurrence UI**: No frontend for creating recurring tasks (backend ready)
- **Projects Management**: No project organization interface (schema ready)
- **Notifications**: No email/reminder system
- **Offline Support**: No PWA or sync capabilities
- **Analytics**: No metrics dashboard

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

### Quick-Add Task with NL Parser

1. The quick-add input auto-focuses on page load.
2. Type: `"tomorrow 9am call with Bob"` → **NL parser extracts**: due date, priority
3. **Real-time preview** shows parsed data before submission
4. Press Enter → task appears in list with structured data

### Task Details Modal

1. Click any task in the list → opens detailed modal
2. Edit title, description, due date, priority, tags
3. Save changes → updates task immediately
4. Delete option with confirmation

### Toggle Status

- Click circle icon to mark done/todo.
- Updates API automatically.

### Filter Tasks

- Use tabs: All / To Do / Done.

### Mobile Testing

- Test on mobile device or browser dev tools (responsive design)
- Verify touch interactions work properly
- Check modal responsiveness

### Delete Task

- Click trash icon → removed from list & DB.

### NL Parser Examples

```bash
# Date parsing
"tomorrow 9am" → due: tomorrow at 9 AM
"friday 2pm" → due: next Friday at 2 PM
"today" → due: today at current time

# Priority parsing
"urgent task" → priority: urgent
"high priority" → priority: high
"low priority" → priority: low

# Tag parsing
"review #docs #important" → tags: ["docs", "important"]
"meeting #team #standup" → tags: ["team", "standup"]

# Combined parsing
"urgent finish report by friday #work" → priority: urgent, tags: ["work"], due: next Friday
```

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

## 🚀 Next Development Steps (Priority Order)

### ✅ Week 1 - COMPLETED

1. **✅ Natural Language Parser**
   - Parse dates, priorities, and tags from natural language
   - Real-time preview showing extracted information
   - Supports patterns like "tomorrow 9am", "urgent", "#tags"
   - Integrated into both store and UI components

2. **✅ Task Details Modal**
   - Click any task to open detailed view
   - Full edit capabilities (description, due date, priority, tags)
   - Delete functionality with confirmation
   - Mobile-responsive design

3. **✅ Mobile-First Responsive Design**
   - Optimized layouts for mobile screens
   - Touch-friendly button sizes and spacing
   - Responsive typography and spacing
   - Mobile-optimized modal dialogs

### 🎯 Week 2 - Advanced Features (Next Priority)

4. **Projects Management**
   - Create/edit/delete projects
   - Task assignment to projects
   - Project-based filtering and views
   - Leverage existing `projects` schema

5. **Recurrence UI**
   - Frontend for creating recurring tasks
   - Visual recurrence rule builder
   - Preview upcoming occurrences
   - Connect to existing scheduler backend

6. **Enhanced Filtering**
   - Date range filtering
   - Multiple priority selection
   - Tag-based filtering
   - Search functionality

### 📅 Week 3 - Power Features

7. **Notifications & Reminders**
   - Email/Telegram reminders
   - Browser push notifications
   - Due date alerts
   - Custom notification preferences

8. **Bulk Operations**
   - Select multiple tasks
   - Bulk status updates
   - Bulk delete/archive
   - Batch editing

9. **Analytics Dashboard**
   - Completion rates
   - Task velocity metrics
   - Productivity insights
   - Usage statistics

### 🚀 Future - Scaling & Integration

10. **Offline Mode & Sync**
    - Local storage caching
    - Conflict resolution
    - Background sync
    - PWA capabilities

11. **Team/Org Features**
    - Multi-user task sharing
    - Role-based permissions
    - Team analytics
    - Collaboration tools

12. **Integrations**
    - Calendar sync (Google/Outlook)
    - Slack/Discord notifications
    - Third-party app connections
    - Webhook support

---

pnpm typecheck # TypeScript check
pnpm lint # ESLint

# Database

pnpm db:generate # Generate migrations
pnpm db:push # Push schema to DB
pnpm db:migrate # Run pending migrations
pnpm db:studio # Open Drizzle Studio GUI

# Docker

docker-compose up -d # Start Postgres
docker-compose down # Stop services
docker-compose logs # View logs

# Build

pnpm build # Production build
pnpm start # Run production server

````

---

## Troubleshooting

**DB Connection Error**

```bash
docker-compose up -d    # Ensure Postgres is running
# Check: docker ps
````

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
