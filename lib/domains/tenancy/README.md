## Tenancy domain (`tenancy`)

### Purpose

Organization/team/membership management and tenant configuration.

### Lineage

- **URLs**: `lib/routes.ts` (`routes.ui.tenancy.*`, `routes.api.v1.tenancy.*`)
- **UI routes**: `app/(app)/app/tenancy/*`
- **API routes (v1)**: `app/api/v1/(tenancy)/*`
- **DB schema**: `lib/server/db/schema/index.ts` + `drizzle/*.sql`

### Checklist

| Feature                         | UI (page)                                      | API                            | DB tables                                    | Key components                      | Status |
| ------------------------------- | ---------------------------------------------- | ------------------------------ | -------------------------------------------- | ----------------------------------- | ------ |
| Organizations (list/new/detail) | `app/(app)/app/tenancy/organizations/*`        | `/api/v1/organizations*`       | `public.organizations`, `public.memberships` | tenancy pages + forms               | ✅      |
| Teams (list/new/detail)         | `app/(app)/app/tenancy/teams/*`                | `/api/v1/teams*`               | `public.teams`, `public.memberships`         | tenancy pages + forms               | ✅      |
| Memberships                     | `app/(app)/app/tenancy/memberships/page.tsx`   | (covered via org/team APIs)    | `public.memberships`                         | —                                   | ✅      |
| Tenant design system            | `app/(app)/app/tenancy/design-system/page.tsx` | `/api/v1/tenant/design-system` | `public.tenant_design_system`                | `lib/client/store/design-system.ts` | ✅      |

