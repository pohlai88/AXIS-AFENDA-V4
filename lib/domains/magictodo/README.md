## MagicToDo domain (`magictodo`)

### Purpose

Task/project management functionality.

### Lineage

- **URLs**: `lib/routes.ts` (`routes.ui.magictodo.*`, `routes.api.v1.magictodo.*`)
- **UI routes**: `app/(app)/app/(magictodo)/*`
- **API routes (v1)**: `app/api/v1/(magictodo)/*`
- **DB schema**: `lib/server/db/schema/index.ts` + `drizzle/*.sql`

### Checklist

| Feature           | UI (page)                                     | API                             | DB tables                                 | Key components                 | Status |
| ----------------- | --------------------------------------------- | ------------------------------- | ----------------------------------------- | ------------------------------ | ------ |
| Tasks             | `app/(app)/app/(magictodo)/tasks/page.tsx`    | `/api/v1/tasks*`                | `public.tasks`, `public.task_history`     | `lib/client/store/tasks.ts`    | ✅      |
| Projects          | `app/(app)/app/(magictodo)/projects/page.tsx` | `/api/v1/projects*`             | `public.projects`                         | `lib/client/store/projects.ts` | ✅      |
| Recurrence engine | —                                             | `/api/cron/generate-recurrence` | `public.recurrence_rules`, `public.tasks` | —                              | ✅      |

