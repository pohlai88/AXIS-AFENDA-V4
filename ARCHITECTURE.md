# AFENDA — Architecture & Repository Layout (Future Reference)

This document defines **where code should live** and the **rules of composition** so the repo stays predictable over time.

If you’re adding something new and you’re unsure where it belongs, start here.

---

## Guiding principles

1. **One source of truth** per concern (avoid `*-enhanced`, `*-v2`, duplicated hooks, etc.).
2. **Clear boundaries**: server-only vs client-only code is enforced.
3. **Contracts first**: API request/response schemas and constants are centralized.
4. **Shallow routing**: no duplicate URLs and no accidental route collisions.
5. **Green checks**: keep `pnpm lint`, `pnpm typecheck`, `pnpm build` green.

---

## High-level directory map (what lives where)

### `app/` — Next.js App Router (routes + UI entrypoints)

- **Pages & layouts**: `app/**/page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **Route handlers**: `app/api/**/route.ts`
- **Route groups**: `app/(public)/*`, `app/(app)/*`
  - Route groups **do not** affect the URL; they only organize code.
  - **Never create two pages that resolve to the same URL path.**

**Recommended structure**
- `app/(public)/*`: public pages (marketing, login/register)
- `app/(app)/app/*`: authenticated app shell pages

### `components/` — Shared UI components

- **Reusable UI primitives** (shadcn/base-ui wrappers): `components/ui/*`
- **App-level shared components** used across routes: `components/*`

Rules:
- UI components should be **pure** and avoid business logic.
- If a component needs business logic, extract it into `lib/` and pass data/handlers in.

### `lib/` — Shared logic (the “platform layer”)

This is where reusable non-route code lives.

**Subfolders**
- `lib/constants/*`: string constants, header/cookie names, storage keys, etc.
- `lib/contracts/*`: Zod request/response schemas (API contracts)
- `lib/api/*`: API client utilities (fetch wrapper, endpoints)
- `lib/server/*`: server-only logic (auth context, db, caching, API helpers)
- `lib/client/*`: client-only logic (zustand stores, client hooks)
- `lib/shared/*`: code shared by server + client (pure utilities)
- `lib/utils.ts`: shared helpers (keep it curated; don’t dump everything here)

### `lib/server/db/*` — Database and migrations

- Schema: `lib/server/db/schema/index.ts`
- DB entrypoint (preferred import): `import { db, getDb, withTransaction } from "@/lib/server/db"`
- SQL migrations: `drizzle/*.sql`

Rules:
- **Do not** import `lib/server/db/client.ts` directly from random modules; use the barrel `@/lib/server/db`.
- Schema changes require a migration:
  - `pnpm db:generate`
  - `pnpm db:migrate`

### `scripts/` — Operational scripts (devops / migrations / validation)

- One-off utilities, migrations runners, diagnostics scripts.
- Keep them isolated; don’t let scripts drive app architecture.

### `tests/` — Unit/integration test code (typed separately)

- Typechecked via `pnpm typecheck:tests`
- Typechecked in full suite via `pnpm typecheck:all`

---

## Server vs client boundaries (hard rules)

### Server-only code

Any server-only module must start with:

```ts
import "@/lib/server/only"
```

Typical server-only modules:
- `lib/server/**`
- route handlers: `app/api/**/route.ts`

### Client-only code

Any client module must start with:

```ts
"use client"
```

Typical client-only modules:
- `lib/client/**`
- client components under `app/**` that use hooks/state

### Shared code

Shared code lives in `lib/shared/**` and must be:
- deterministic
- environment-agnostic
- no direct access to `next/headers`, DB clients, Node-only APIs

---

## Where to put new code (decision table)

- **New route/page** → `app/(public)/*` or `app/(app)/app/*`
- **New API endpoint** → `app/api/.../route.ts`
  - put parsing/validation schema in `lib/contracts/*`
  - put reusable logic in `lib/server/*` or `lib/shared/*`
- **New shared UI** → `components/*` or `components/ui/*`
- **New feature state** (client) → `lib/client/store/*` (zustand) + `lib/client/hooks/*`
- **New DB query** → `lib/server/db/queries/*` (and `queries-edge/*` if edge runtime)
- **New “constants”** → `lib/constants/*` (then import from there everywhere)
- **New auth behavior** → `lib/server/auth/*` (Neon Auth integration + helpers)
- **New tenancy / request context** → `proxy.ts` + constants + `lib/server/tenant/*`

---

## File naming & conventions

- **Route handler** files are always `route.ts`
- **React components**: `kebab-case.tsx` for shared components; route files follow Next conventions.
- **Avoid duplicate implementations**: if you create a replacement, delete the old one in the same PR.
- Prefer **named exports** unless Next requires default export (e.g., page components).

---

## API conventions (shape + errors)

Route handlers should:
- validate inputs with Zod schemas in `lib/contracts/*`
- return consistent envelopes via `lib/server/api/*`
- include request IDs when available (`HEADER_NAMES.REQUEST_ID`)
- use constants from `lib/constants/*` (no magic headers/cookies)

---

## Cross-cutting helpers (must be centralized)

These are shared primitives intended to prevent drift and avoid “everyone rolls their own” patterns.

### Logger

- **Server logger**: `lib/server/logger.ts` (pino)
- **Shared interface**: `lib/shared/logger.ts`

Rules:
- Do not add new direct `console.*` usage in server modules; use `logger.*`.
- Attach context at boundaries: `logger.child({ requestId, tenantId, userId })`.

### Circuit breaker (network boundaries)

- Circuit breaker implementation: `lib/shared/circuit-breaker.ts`
- Defaults: `CIRCUIT_BREAKER` in `lib/constants/index.ts`

Rules:
- Use circuit breaker at **outbound network edges** (HTTP to external services), not inside DB transactions.
- Approved integration points:
  - `lib/api/client.ts` (outbound fetch via `apiFetch`)
  - `lib/server/neon/data-api.ts`
  - `lib/server/auth/neon-integration-enhanced.ts` (JWKS key fetch)

---

## Routing + Contracts (anti-mess standard)

### Routing standard

Default to REST resources:
- Collection: `app/api/v1/<resource>/route.ts` → `GET` (list), `POST` (create)
- Item: `app/api/v1/<resource>/[id]/route.ts` → `GET` (read), `PATCH` (update), `DELETE` (delete)

State transitions:
- Prefer `PATCH` on the resource (e.g., `{ status: "done" }`) rather than creating new action endpoints.

True actions (rare):
- Use `POST /api/v1/<resource>/<id>/actions/<action>` if it does not model cleanly as state.

Operational/framework routes:
- Keep system jobs under `app/api/cron/*`
- Keep framework-required routes under their conventions (e.g. auth provider routes under `app/api/auth/*`)

### Zod + types standard

Contracts:
- Define schemas in `lib/contracts/*` and derive types via `z.infer`.

Server validation:
- Body: `parseJson(req, Schema)` in `lib/server/api/validate.ts`
- Query: `parseSearchParams(searchParams, Schema)`

Responses:
- Always return the standard envelope via `lib/server/api/response.ts` (`ok` / `fail`).

Client:
- Prefer `apiFetch(url, init, DataSchema)` which validates the envelope and returns typed data.

---

## Auth / Session conventions

- NextAuth has been removed; auth is being consolidated around Neon Auth.
- Auth context: `lib/server/auth/context.ts` is the canonical “who am I?” server lookup

Session note:
- The DB `sessions.user` JSONB exists for optional debugging/auditing and has a DB default (`{}`).

---

## Typecheck strategy (prevents “.next” drift)

Use these scripts:
- `pnpm typecheck` → app code, stable (no `.next` dependency)
- `pnpm typecheck:tests` → tests
- `pnpm typecheck:next` → Next.js config including `.next/types` (useful in CI or after build)
- `pnpm typecheck:all` → everything

---

## “Green PR” checklist

Before merging:
- [ ] No route collisions (no two pages resolve to the same URL)
- [ ] `pnpm lint` is clean
- [ ] `pnpm typecheck` is clean
- [ ] `pnpm build` is clean
- [ ] DB changes include a migration in `drizzle/*.sql`
- [ ] New strings are added to `lib/constants/*` (no drift)
- [ ] API changes include Zod contracts in `lib/contracts/*`

