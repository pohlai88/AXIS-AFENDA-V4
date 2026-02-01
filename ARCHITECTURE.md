# AFENDA — Domain-first Architecture (Authoritative)

This document is the **single source of truth** for where code lives and how domains interact.

It replaces any prior “where should this go?” guidance and is designed to prevent drift, mixed ownership, and route/API chaos.

Reference (Next.js App Router conventions): `https://nextjs.org/docs/app/getting-started/project-structure`

---

## Non-negotiable principles

1. **Domain ownership is absolute**: every feature belongs to exactly one domain.
2. **No mixing**: domains must not import other domains’ internal files.
3. **URL stability + clarity**: authenticated UI is under `/app/*`, tenancy is under `/app/tenancy/*`.
4. **Contracts first**: request/response schemas live in `lib/contracts/**` and are reused on server + client.
5. **Envelope always**: API responses use the `{ data, error }` envelope via `ok()` / `fail()`.
6. **Boundaries enforced**:
   - server-only modules import `@/lib/server/only` at the top
   - client modules start with `"use client"`
   - shared modules are deterministic and environment-agnostic
7. **No magic strings**: route and endpoint paths are imported from `lib/routes.ts`.

---

## Domain taxonomy (only these domains)

- **marketing**: public informational pages and marketing UI.
- **auth**: login/register/reset/verify flows + auth APIs + auth/session utilities.
- **orchestra**: authenticated app shell + orchestration/system coordination (shell layout, module registry, integration/sync/scheduler concerns when needed).
- **magictodo**: product core: **tasks + projects only**.
- **tenancy**: multi-tenancy governance: tenant/org/team/membership + tenant theming.

---

## Cross-domain dependencies (allowed direction)

Domains may depend on **shared** (`components/ui`, `lib/shared`, `lib/constants`, `lib/contracts`) freely.

Domain-to-domain rules:

- `marketing` → `shared`
- `auth` → `shared`
- `magictodo` → `shared`, `auth` (read-only auth context), `tenancy` (read-only tenancy context)
- `tenancy` → `shared`, `auth` (read-only auth context)
- `orchestra` → `shared`, `auth` (read-only auth context), `tenancy` (read-only tenancy context), `magictodo` (**only via public registries/barrels**, never internals)

Hard rule:
- **No imports from another domain’s `_components`, `_lib`, `_actions`, or non-barrel modules.**

---

## Repository structure (authoritative)

### `app/` — Next.js App Router (routes + API entrypoints)

- UI routes: `app/**/page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- API routes: `app/api/**/route.ts`
- Organize without changing URLs using route groups: `app/(group)/**`
- Colocate non-routable code with private folders: `_components`, `_lib`, `_actions`

### `components/` — shared UI only

Allowed:
- `components/ui/*` primitives (shadcn-style)
- domain-agnostic presentational components that have **no auth/tenant/permissions** dependency

Not allowed:
- permission guards, feature flags, shell navigation, tenant/user switchers, session/tenant state
  - those are **app-shell owned** under `app/(app)/_components/**` or domain route `_components/**`

### `lib/` — layered by runtime, then by domain

Canonical layers:
- `lib/contracts/<domain>/**` (Zod schemas and types)
- `lib/server/<domain>/**` (server-only services/queries; must `import "@/lib/server/only"`)
- `lib/client/<domain>/**` (client-only hooks/stores; must start with `"use client"`)
- `lib/shared/<domain>/**` (pure shared utilities)
- `lib/constants/**` (headers/cookies/status codes/etc.)
- `lib/api/**` (API client utilities; validates envelopes)
- `lib/routes.ts` (the one canonical path registry)

---

## Canonical URL policy (hard-delete, no legacy aliases)

### Public URLs
- `/` (marketing home)
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/auth/callback`
- `/terms`, `/privacy`, `/security`, `/infrastructure`
- `/components` (UI playground, optional)

### Authenticated URLs (canonical)
All authenticated UI routes MUST live under:

- **`/app/*`**

### Tenancy URLs (canonical)
All tenancy governance UI MUST live under:

- **`/app/tenancy/*`**

Examples:
- `/app/tenancy/organizations`
- `/app/tenancy/teams`
- `/app/tenancy/memberships`
- `/app/tenancy/design-system`

Hard-delete policy:
- legacy authenticated routes outside `/app/*` are removed (no redirects)

---

## Routing structure (domain-owned, URL-stable)

Use route groups for domain organization; groups do not affect the URL.

### Public

```
app/
  (public)/
    (marketing)/
      page.tsx
      terms/page.tsx
      privacy/page.tsx
      security/page.tsx
      infrastructure/page.tsx
      components/page.tsx
      _components/*
      _lib/*
    (auth)/
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
      verify-email/page.tsx
      auth/callback/page.tsx
      _components/*
      _lib/*
```

### Authenticated

```
app/
  (app)/
    layout.tsx
    _components/*         # app-shell owned (auth/tenant allowed)
    app/
      (orchestra)/
        page.tsx          # /app
        modules/page.tsx  # /app/modules
      (magictodo)/
        tasks/page.tsx    # /app/tasks
        projects/page.tsx # /app/projects
      tenancy/
        organizations/page.tsx
        teams/page.tsx
        memberships/page.tsx
        design-system/page.tsx
      settings/
        page.tsx
        sessions/page.tsx
```

Rule:
- Route-local UI belongs in `app/**/_components/**`.
- Route-local helpers belong in `app/**/_lib/**`.

---

## API architecture (strict, minimal v1)

### Minimal v1 surface (anti-drift)
Keep `/api/v1` limited to endpoints with clear ownership and active consumers:

- **auth**: `/api/v1/me`, `/api/v1/users/*`, `/api/v1/sessions/*`
- **tenancy**: `/api/v1/organizations/*`, `/api/v1/teams/*`, `/api/v1/tenant/*`
- **magictodo**: `/api/v1/tasks/*`, `/api/v1/projects/*`

Orchestra APIs (sync/scheduler/integrations) must be explicit and owned:
- preferred: `/api/orchestra/*` (internal, not part of v1)
- only use `/api/v1/*` if the endpoint is truly public + stable + has active consumers

Debug-only endpoints must never be in v1:
- `/api/debug/*`

### Domain ownership without changing URLs
Use route groups inside `app/api/**` to keep code domain-owned while preserving paths.

Example:

```
app/api/
  auth/(auth)/*/route.ts
  v1/
    (auth)/*
    (tenancy)/*
    (magictodo)/*
```

### Response envelope (mandatory)
All API routes return:
- success: `{ data: T, error: null }`
- failure: `{ data: null, error: { code, message, details?, requestId? } }`

Server helpers are in `lib/server/api/response.ts` (`ok`, `fail`).

---

## Tenancy context (how it works)

Tenancy is **cookie/header** based (not URL-based):
- middleware `proxy.ts` propagates tenant cookie → tenant header
- server reads tenancy from `lib/server/tenant/context.ts`

Tenancy UI lives under `/app/tenancy/*`, but tenancy resolution does not depend on the path.

---

## Canonical route registry (no path strings)

**All** UI route paths and API endpoint paths must come from:

- `lib/routes.ts`

Rules:
- do not write `"/app/..."` or `"/api/..."` in components/pages/services
- if you need a new route, add it to `lib/routes.ts` first

---

## File envelope header (mandatory on domain modules)

Every domain-owned module (and any shared module that is part of the public surface) must start with:

```ts
/**
 * @domain magictodo
 * @layer server
 * @responsibility Task read/write operations.
 * @dependencies
 * - shared
 * - contracts
 * @exports
 * - createTask()
 * - updateTask()
 */
```

Rules:
- keep it short (5–12 lines)
- the header must match the folder it’s in (no lying)
- do not add headers to generated files

---

## Quality gates (must stay green)

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`

Also ensure:
- no route collisions (Next.js rule)
- no cross-domain internal imports
- no API endpoints outside the strict v1 registry

