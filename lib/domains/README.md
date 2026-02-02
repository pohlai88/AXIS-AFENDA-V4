## `lib/domains/` — Domain map + lineage

This folder is the **single entry-point** for understanding domain boundaries in AFENDA.

### Lineage (how to trace a feature)

- **URLs (source of truth)**: `lib/routes.ts`
- **UI routes**: `app/(public)/*` and `app/(app)/app/*`
- **API routes**:
  - **Neon Auth catch-all**: `app/api/auth/(auth)/[...path]/route.ts` (backing `createAuthClient()` and `createNeonAuth()`)
  - **Feature-first APIs**: `app/api/(public)/(auth)/*` (mirrors public auth UI route names)
  - **Versioned public API**: `app/api/v1/*`
- **DB schema & migrations**: `lib/server/db/schema/*` + `drizzle/*.sql`
- **Domain route registries**: `lib/domains/*/registry.ts`

### Domains

- **Auth**: [`lib/domains/auth/README.md`](./auth/README.md)
- **Marketing**: [`lib/domains/marketing/README.md`](./marketing/README.md)
- **Orchestra (app shell)**: [`lib/domains/orchestra/README.md`](./orchestra/README.md)
- **MagicToDo (tasks/projects)**: [`lib/domains/magictodo/README.md`](./magictodo/README.md)
- **Tenancy (org/team/memberships)**: [`lib/domains/tenancy/README.md`](./tenancy/README.md)

