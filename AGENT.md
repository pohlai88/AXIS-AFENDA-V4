# AFENDA — Agent Guide (Anti‑drift)

This file is the entry point for AI agents working in this repository.
The goal is **stability + consistency**: prevent drift, avoid duplicate patterns, and keep `pnpm lint/typecheck/build` green.

## Quick start (golden commands)

- Install: `pnpm install`
- Dev: `pnpm dev`
- Lint (must be clean): `pnpm lint`
- Typecheck (stable, no `.next` dependency): `pnpm typecheck`
- Typecheck (tests): `pnpm typecheck:tests`
- Typecheck (full suite): `pnpm typecheck:all`
- Build (must be clean): `pnpm build`

### TypeScript config gotcha (prevents recurring failures)

Next.js may auto-edit `tsconfig.json` during `pnpm build` to include `.next/types/**`.
To avoid typecheck breaking when `.next` isn’t present, **use**:

- `tsconfig.typecheck.json` (used by `pnpm typecheck`)
- `tsconfig.tests.json` (used by `pnpm typecheck:tests`)

## Repository map

- App Router: `app/`
- Shared logic: `lib/`
- UI components: `components/`
- API routes: `app/api/**/route.ts`
- Middleware / request context: `proxy.ts`
- DB schema & migrations: `lib/server/db/schema/*`, `drizzle/*.sql`

## Non‑negotiable conventions (no exceptions)

### Server vs client boundaries

- **Server-only modules** must import `@/lib/server/only` at the top.
- **Client components/hooks** must start with `"use client"` and keep imports client-safe.

### Constants (no magic strings)

Always import from `@/lib/constants` (or its submodules). Prefer:

- `HEADER_NAMES` (NOT `headerNames.*`)
- `COOKIE_NAMES` (NOT `TENANT_COOKIE`)
- `STORAGE_KEYS` (NOT `storageKeys`)
- `HTTP_STATUS`, `API_ERROR_CODES`, `CACHE_TTL`, `DB_LIMITS`

This repo had real failures caused by “legacy constant drift”. Treat these as strict.

### Logging (no console drift)

- Use the server logger: `import { logger } from "@/lib/server/logger"`.
- Do not add new `console.*` calls in server code (use `logger.*`).

### Resiliency (network boundaries)

- Outbound fetch is protected via circuit breaker in `lib/api/client.ts`.
- When adding new external network calls in server code, either:
  - route them through `apiFetch`, or
  - use the circuit breaker pattern from `lib/shared/circuit-breaker.ts`.

### Database access

- **Import DB from the barrel**: `import { db, getDb, withTransaction } from "@/lib/server/db"`
- Do **not** import from `lib/server/db/client.ts` directly unless you are working inside `lib/server/db/*`.
- Migrations are in `drizzle/*.sql`. Prefer `pnpm db:generate` + `pnpm db:migrate`.

#### Sessions schema note (legacy)

The `sessions.user` JSONB column exists for optional debugging/auditing and has a DB default (`{}`).
It was originally introduced for NextAuth compatibility; NextAuth has since been removed.

### API route shape + error handling

- Validate inputs with Zod schemas in `lib/contracts/*` (API contracts).
- Use `HttpError` + helpers from `lib/server/api/*` for consistent envelopes.
- Include `x-request-id` in responses/logs when available.

### Caching

- Prefer cache tags from `lib/server/cache/tags.ts`.
- Invalidate via `invalidateTag` / `invalidatePath` from `lib/server/cache/revalidate.ts`.
- Use `CACHE_TTL` values.

## Next.js routing rules (prevents build/runtime crashes)

- **Never create two pages that resolve to the same path**.
  - Example of what to avoid: `/register` existing in both `app/register/page.tsx` and `app/(public)/register/page.tsx`.
- Route groups `(public)`, `(app)` are for organization only; they do not change the URL.
- When adding a new route, search for existing pages/handlers that would collide.

## API routing standard (REST-by-default)

- Resource collections: `GET|POST /api/v1/<resource>`
- Resource items: `GET|PATCH|DELETE /api/v1/<resource>/<id>`
- State transitions: prefer `PATCH` updating a field (e.g., `status`)
- True actions (rare): `POST /api/v1/<resource>/<id>/actions/<action>`

## Auth rules (single source of truth)

- NextAuth has been removed; the auth system is being consolidated around **Neon Auth**.
- Prefer server-side auth context: `lib/server/auth/context.ts` (do not re-implement auth lookup ad-hoc).

## Best-practice workflow (how to avoid drift)

### Before changing code

1. Run (or ensure) these are green:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm build`
2. Identify server/client boundary for the file you are editing.
3. Prefer existing utilities/constants instead of adding new ones.

### Adding a feature (preferred order)

1. Add/extend constants in `lib/constants/*` (typed, documented).
2. Add validation schemas in `lib/contracts/*` (Zod).
3. If calling APIs from client, use `apiFetch` in `lib/api/client.ts`.
4. In route handlers, return standardized envelopes via `lib/server/api/*`.
5. Add/adjust tests and run `pnpm typecheck:tests` (and optionally a real test runner if configured).

### Refactoring

- Replace magic strings with constants.
- Keep exports named where practical.
- Delete unused/duplicate modules rather than leaving “two versions” (`*-enhanced`, `*-v2`, etc.) around.

## Next.js MCP diagnostics (fastest way to find real errors)

When the dev server is running (Next 16+), prefer runtime diagnostics:

- Discover servers/tools: `nextjs_index`
- Get current error state: `get_errors`
- If `get_errors` shows “no browser sessions”, open a browser session to the app first.

## Common paths

- App shell routes: `app/(app)/app/*`
- Public routes: `app/(public)/*`
- Auth: `app/(public)/login`, `app/(public)/register`
- API v1: `app/api/v1/*`

## Troubleshooting checklist

- **Type errors**:
  - App only: `pnpm typecheck`
  - Tests only: `pnpm typecheck:tests`
  - Full suite: `pnpm typecheck:all`
- **Lint**: `pnpm lint`
- **Build**: `pnpm build`
- **Runtime overlay errors**: use Next.js MCP `get_errors` from the running dev server.

## Documentation index

- Root docs: `README.md`
- App Router: `app/README.md`
- Shared library: `lib/README.md`
- Constants: `lib/constants/README.md`
- Performance: `lib/PERFORMANCE-OPTIMIZATION-GUIDE.md`
- Consistency: `lib/CONSISTENCY-AUDIT.md`
