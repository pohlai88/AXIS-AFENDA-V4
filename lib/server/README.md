# `lib/server/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Rules

- Every module here should start with:
  - `import "@/lib/server/only"`
- Do not import these modules from Client Components.
- Exception: `lib/server/db/schema/*` should **not** import `@/lib/server/only` so that `drizzle-kit` can load schema files in a plain Node context.

## Contents

- `api/`: route-handler helpers (validation + consistent response envelope).
- `auth/`, `tenant/`: request-scoped context (currently placeholders).
- `cache/`: tag naming + invalidation helpers.
- `db/`: Drizzle schema, queries, and `getDb()`.

