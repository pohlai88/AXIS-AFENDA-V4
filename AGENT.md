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

### App-shell integration (required for all `/app/*` features)

When you add or modify any feature that lives under the authenticated app area (`/app/*`), you must integrate it into the **AppShell** so the feature is reachable, auth-safe, and consistent across builds.

- **UI standardization is ongoing (constant work)**
  - Treat the UI as **shadcn-first**: prefer **shadcn Blocks** for page/layout structure and **shadcn primitives** for components.
  - Avoid “random Tailwind” styling drift:
    - Prefer **semantic tokens** (`bg-background`, `text-muted-foreground`, etc.) over hardcoded palette classes.
    - Prefer shadcn primitives (`Card`, `Alert`, `Badge`, `Tabs`, `Skeleton`, `Sidebar`, etc.) over custom div wrappers.
  - Keep all pages consistent with the App Shell patterns (Sidebar + inset header).
  - Canonical reference: `lib/shadcn-ui.md` (best practices + checklist for this repo).

- **shadcn Blocks + pnpm workspace notes (important)**
  - This repo uses **pnpm workspaces** (`pnpm-workspace.yaml` includes `"."`), so shadcn CLI runs `pnpm add ...` at the workspace root.
  - If you see `ERR_PNPM_ADDING_TO_ROOT`, fix it by adding a project-local `.npmrc`:
    - `ignore-workspace-root-check=true`
  - The shadcn CLI **does not support** `-w` (that flag is for pnpm). Use `-w` only when running `pnpm add -w ...` directly.
  - When adding Blocks like `sidebar-07`, shadcn may prompt to overwrite existing `components/ui/*` files (e.g. `button.tsx`). Prefer **not** overwriting unless you explicitly want shadcn defaults:
    - **View before add**: `npx shadcn@latest view @shadcn/sidebar-07`
    - **Add block**: `npx shadcn@latest add @shadcn/sidebar-07`
    - **Force overwrite (use with care)**: `npx shadcn@latest add -o @shadcn/sidebar-07`

- **Navigation + routes**
  - Add/verify a route helper in `lib/routes.ts` under `routes.app.*` (avoid hardcoding strings like `"/app/foo"` throughout the UI).
  - Add/verify an entry in the AppShell sidebar: `app/(app)/layout.tsx` (e.g., Tasks link).

- **Auth gate (server-side)**
  - AppShell layout (`app/(app)/layout.tsx`) must remain the server-side auth boundary via `getAuthContext()` and `redirect(...)` when unauthenticated.

- **Client user propagation (no hardcoded IDs)**
  - Client pages/components that call APIs must obtain the authenticated user from the session-backed endpoint (use `lib/client/hooks/use-auth.ts`, which fetches `/api/v1/me`).
  - Never hardcode `userId` (e.g., `"user-123"`) in stores, pages, or API calls.

- **Client stores + API calls**
  - Stores in `lib/client/store/*` must accept `userId` as an argument for any API call method (`fetch*`, `create*`, `update*`, `delete*`).
  - Standardize API access through store methods (avoid mixing direct `fetch()` calls with store calls unless there is a good reason).
  - Ensure requests include the expected identity/tenancy headers (e.g., `x-user-id` where required by the backend).

- **Build safety**
  - The integration is not “done” until `pnpm build` passes.
  - If you change nav/routes/auth wiring, also verify TypeScript + lint remain clean (`pnpm typecheck`, `pnpm lint`).

Reference: `APPSHELL-INTEGRATION.md` (canonical fixes/patterns from the Tasks/MagicToDo integration).

### Tailwind v4 editor warnings (ignore)

Tailwind v4 introduces CSS at-rules like `@theme` and `@custom-variant` (see `app/globals.css`).
Some editors flag these as “unknown at rule” / “CSS syntax error”. **Ignore these warnings**.
Workspace settings in `.vscode/settings.json` are configured to suppress them.

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

