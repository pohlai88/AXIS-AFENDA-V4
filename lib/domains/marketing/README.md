## Marketing domain (`marketing`)

### Purpose

Public marketing/informational routes (no auth required), including offline UX.

### Lineage

- **URLs**: `lib/routes.ts` (`routes.ui.marketing.*`)
- **UI routes**: `app/(public)/(marketing)/*`

### Checklist

| Area                  | UI (page)                                          | API | DB  | Key components                        | Status |
| --------------------- | -------------------------------------------------- | --- | --- | ------------------------------------- | ------ |
| Home                  | `app/(public)/(marketing)/page.tsx`                | —   | —   | `app/(public)/_components/*`          | ✅      |
| Terms                 | `app/(public)/(marketing)/terms/page.tsx`          | —   | —   | `app/(public)/_components/footer.tsx` | ✅      |
| Privacy               | `app/(public)/(marketing)/privacy/page.tsx`        | —   | —   | `app/(public)/_components/footer.tsx` | ✅      |
| Security              | `app/(public)/(marketing)/security/page.tsx`       | —   | —   | `app/(public)/_components/footer.tsx` | ✅      |
| Infrastructure        | `app/(public)/(marketing)/infrastructure/page.tsx` | —   | —   | `app/(public)/_components/footer.tsx` | ✅      |
| Components playground | `app/(public)/(marketing)/components/page.tsx`     | —   | —   | `components/ui/*`                     | ✅      |
| Offline               | `app/(public)/(marketing)/offline/page.tsx`        | —   | —   | —                                     | ✅      |

