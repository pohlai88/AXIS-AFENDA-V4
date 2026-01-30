# AFENDA — Agent Guide

This file is the **entry point for AI agents** working in this repository.

## Quick start

- **Install**: `pnpm install`
- **Dev**: `pnpm dev`
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`
- **Typecheck**: `pnpm typecheck`

## Project shape (high-level)

- **Next.js App Router** lives in `app/`.
- **Shared code** lives in `lib/`.
- **Reusable UI components** live in `components/`.

## Conventions (do not break)

### Server vs client boundaries

- **Server-only modules** must import `@/lib/server/only` at the top of the module.
  - This enforces Next.js `server-only` behavior and prevents accidental client bundling.
- **Client components** must start with `"use client"` and should keep their import graph client-safe.

### Drift-prevention (enforced by lint)

These rules are enforced in `eslint.config.mjs` and should be treated as **non-negotiable**:

- **No direct `server-only` imports**: always use `@/lib/server/only`.
- **No server imports from client/shared code**:
  - `components/*`, `hooks/*`, `lib/client/*`, `lib/shared/*`, `lib/api/*`, `lib/contracts/*`, etc. must not import `@/lib/server/*` or `@/lib/env/server`.
- **Route handlers stay thin**:
  - Route handlers (`app/**/route.ts(x)`) must not import `zod` directly.
  - Route handlers must not import Drizzle (`drizzle-orm`, `drizzle-orm/*`) or DB internals (`@/lib/server/db/client|schema|zod`).
  - Route handlers should use **contracts** from `lib/contracts/*` and **queries** from `lib/server/db/queries/*`.

### Environment variables

- Use `lib/env/server.ts` for server env access (`getServerEnv`, `requireServerEnv`).
- Use `lib/env/public.ts` for public env access (`getPublicEnv`).
- Avoid direct `process.env.*` access in app/lib code unless it is tooling-only (e.g. `drizzle.config.ts`).

### API response shape

API handlers should return a consistent envelope:

- success: `{ data: T, error: null }`
- failure: `{ data: null, error: ApiError }`

See `lib/server/api/response.ts` and `lib/contracts/api-error.ts`.

### Caching / invalidation

- Prefer cache tagging via `lib/server/cache/tags.ts`.
- Prefer invalidation helpers in `lib/server/cache/revalidate.ts` (`invalidateTag`, `invalidatePath`).

### Database access

- Use `lib/server/db/client.ts` `getDb()` (handles dev/HMR singleton behavior).
- Keep DB usage in server-only modules.

### Request ID + tenant propagation (proxy middleware)

- The request “proxy middleware” lives in `proxy.ts` and injects:
  - `x-request-id` (generated if missing)
  - `x-tenant-id` (from `afenda_tenant_id` cookie, when present)
- Server code should read these via `lib/constants/headers.ts` (`headerNames`) and `next/headers`.

### Neon (recommended Postgres provider)

- **CLI** (installed as a dev dependency): `pnpm neon:auth`, `pnpm neon:projects`
- **MCP**: Use the Neon MCP server to manage projects/branches and fetch connection strings.
- **Runtime drivers**:
  - **Node runtime (default)**: `lib/server/db/client.ts` uses `postgres` + Drizzle. Works with Neon `DATABASE_URL`.
  - **Serverless/edge**: use `lib/server/db/client-neon-http.ts` (`getDbHttp`) with `@neondatabase/serverless` + Drizzle (HTTP).
  - **Edge-safe queries**: import DB access from `lib/server/db/queries-edge/*` (uses `getDbHttp`) and set `export const runtime = "edge"` in the route handler.

## Next.js MCP (runtime devtools)

When diagnosing the running dev server:

- Prefer runtime inspection (routes/errors/logs) via the Next.js devtools MCP endpoint (`/_next/mcp`) instead of guessing.
- If there’s a mismatch between “what code says” and “what server does”, trust runtime evidence first.

## Docs / navigation

- Root navigation hub: `README.md`
- Folder-level docs: each major folder has its own `README.md` and links back to the root.

