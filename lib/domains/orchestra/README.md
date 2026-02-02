## Orchestra domain (`orchestra`)

### Purpose

The authenticated **app shell** domain:
- shell routes (`/app`, navigation, modules)
- analytics + approvals UX
- cron + debug endpoints (operational)

### Lineage

- **URLs**: `lib/routes.ts` (`routes.ui.orchestra.*`, `routes.api.orchestra.*`, `routes.api.cron.*`, `routes.api.debug.*`)
- **UI routes**: `app/(app)/app/(orchestra)/*`
- **API routes**: `app/api/orchestra/(orchestra)/*`, `app/api/cron/*`, `app/api/debug/(debug)/*`

### Checklist

| Area              | UI (page)                                      | API                                              | DB                                        | Key components                               | Status       |
| ----------------- | ---------------------------------------------- | ------------------------------------------------ | ----------------------------------------- | -------------------------------------------- | ------------ |
| Shell root        | `app/(app)/app/(orchestra)/page.tsx`           | —                                                | —                                         | `app/(app)/_components/*`                    | ✅            |
| Analytics         | `app/(app)/app/(orchestra)/analytics/page.tsx` | `/api/orchestra/analytics*`                      | `public.user_activity_log` (usage varies) | `lib/client/store/analytics.ts`              | ✅            |
| Approvals         | `app/(app)/app/(orchestra)/approvals/page.tsx` | `/api/orchestra/approvals*`                      | `public.*` (domain specific)              | `app/(app)/app/(orchestra)/approvals/ui.tsx` | ✅            |
| Modules           | `app/(app)/app/(orchestra)/modules/*`          | —                                                | —                                         | —                                            | ✅            |
| Cron (recurrence) | —                                              | `/api/cron/generate-recurrence`                  | `public.recurrence_rules`, `public.tasks` | —                                            | ✅            |
| Debug             | —                                              | `/api/debug/neon-auth`, `/api/debug/neon-config` | `public.*`                                | —                                            | ✅ (dev-only) |

