# AFENDA — Agent Guide

This is the entry point for AI agents working in this repository. Follow it strictly.

## Quick start

- Install: `pnpm install`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Build: `pnpm build`

## Repository map

- App Router: `app/`
- Shared logic: `lib/`
- UI components: `components/`
- Hooks: `hooks/`
- API routes: `app/api/**/route.ts`
- Proxy middleware: `proxy.ts`

## Non-negotiable conventions

### Server vs client boundaries

- Server-only modules must import `@/lib/server/only` at the top.
- Client components must start with `"use client"` and keep imports client-safe.

### Constants (no magic strings)

- Always import from `@/lib/constants`.
- Use `HEADER_NAMES`, `COOKIE_NAMES`, `HTTP_STATUS`, `API_ERROR_CODES`, `CACHE_TTL`, `DB_LIMITS`, `STORAGE_KEYS`.

### Error handling

- Use `Result` for recoverable errors: `lib/shared/result.ts`.
- Use `HttpError` for API errors: `lib/server/api/errors.ts`.
- Use `InvariantError` for assertions: `lib/shared/invariant.ts`.

### Caching

- Prefer cache tags from `lib/server/cache/tags.ts`.
- Invalidate with `invalidateTag`/`invalidatePath` from `lib/server/cache/revalidate.ts`.
- Use `CACHE_TTL` values.

### Database

- Use `getDb()` from `lib/server/db/client.ts`.
- Use `withTransaction()` for multi-statement operations.
- Respect `DB_LIMITS`.

### Request context

- `proxy.ts` injects `x-request-id` and `x-tenant-id`.
- Read headers using `HEADER_NAMES` + `next/headers`.
- Read tenant cookie using `COOKIE_NAMES.TENANT_ID`.

## Best-practice workflow

### Before changing code

1. Read relevant docs:
   - `README.md`
   - `lib/PERFORMANCE-OPTIMIZATION-GUIDE.md`
   - `lib/CONSISTENCY-AUDIT.md`
   - `lib/constants/README.md`
2. Identify server/client boundary for the file.
3. Prefer existing utilities before adding new ones.

### Adding a feature

1. Define constants in `lib/constants/index.ts` (with JSDoc + types).
2. Add validation schemas in `lib/contracts/` (Zod).
3. Use `apiFetch` from `lib/api/client.ts` for API calls.
4. Return consistent API envelopes via `lib/server/api/*` helpers.
5. Add tests or update existing ones if behavior changes.

### Refactoring

- Replace magic strings with constants.
- Replace try/catch with `Result` where appropriate.
- Keep exports named (avoid default exports).

## Performance essentials

- Use `apiFetch` (caching + retries + timeout).
- Use server components for data fetching by default.
- Use `debounce`/`throttle` from `lib/utils.ts` for UI events.
- Keep routes lean; use caching and cache invalidation properly.

## API route checklist

- Validate inputs with Zod schemas.
- Use standardized errors and status codes.
- Include request IDs in logs.
- Cache GET responses when safe, invalidate on mutations.

## Common paths

- App shell routes: `app/(app)/app/*`
- Public routes: `app/(public)/*`
- Auth: `app/(public)/login`, `app/(public)/register`
- API v1: `app/api/v1/*`

## Troubleshooting

- Type errors: run `pnpm typecheck`.
- Lint issues: run `pnpm lint`.
- Build failures: run `pnpm build` and inspect errors.

## Legacy reminders

- Prefer `HEADER_NAMES` over `headerNames`.
- Prefer `COOKIE_NAMES.TENANT_ID` over `TENANT_COOKIE`.
- Prefer `STORAGE_KEYS` over `storageKeys`.
- Prefer `hasPermission()` over `can()`.
- Prefer `validateInvariant()` over `invariant()`.

## Documentation index

- Root docs: `README.md`
- App Router: `app/README.md`
- Shared library: `lib/README.md`
- Constants: `lib/constants/README.md`
- Performance: `lib/PERFORMANCE-OPTIMIZATION-GUIDE.md`
- Consistency: `lib/CONSISTENCY-AUDIT.md`
