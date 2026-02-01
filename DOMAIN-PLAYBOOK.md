# AFENDA — Domain Playbook (How to build without drift)

This is the practical “how-to” companion to `ARCHITECTURE.md`.

Goal: **domain-by-domain development**, **no mixing**, and **no ad-hoc routes/endpoints**.

Reference (Next.js App Router conventions): `https://nextjs.org/docs/app/getting-started/project-structure`

---

## Golden rules (repeat these in code reviews)

- **Every change starts with ownership**: pick the domain first.
- **Paths come from `lib/routes.ts`**. Never type `\"/app\"` or `\"/api\"` in feature code.
- **API work starts from contracts**: add Zod schemas in `lib/contracts/<domain>`.
- **Route handlers orchestrate only**: no Zod in handlers, no DB in handlers, no business logic in handlers.
- **Shared UI stays pure**: if it touches auth/tenant/permissions it is not “shared”.

---

## Domain folders (copy/paste recipes)

### UI pages (App Router)

- **Public marketing**: `app/(public)/(marketing)/...`
- **Public auth**: `app/(public)/(auth)/...`
- **Authenticated orchestra**: `app/(app)/app/(orchestra)/...`
- **Authenticated magictodo**: `app/(app)/app/(magictodo)/...`
- **Authenticated tenancy**: `app/(app)/app/tenancy/...`

Route-local code:
- UI: `_components/**`
- helpers: `_lib/**`
- server actions: `_actions/**` (optional)

### API handlers (App Router route handlers)

- `app/api/auth/(auth)/**/route.ts`
- `app/api/v1/(auth)/**/route.ts`
- `app/api/v1/(tenancy)/**/route.ts`
- `app/api/v1/(magictodo)/**/route.ts`
- `app/api/orchestra/(orchestra)/**/route.ts` (internal, not v1)
- `app/api/debug/(debug)/**/route.ts` (internal/debug, never v1)

---

## Template: add a new UI page (domain-owned)

### Example: add a new Magictodo page

1. **Add the path to** `lib/routes.ts` under `routes.ui.magictodo.*`.
2. Create the route file under:
   - `app/(app)/app/(magictodo)/<segment>/page.tsx`
3. If you need UI helpers/components:
   - create `app/(app)/app/(magictodo)/<segment>/_components/*`
   - create `app/(app)/app/(magictodo)/<segment>/_lib/*`
4. If you need data:
   - server data fetch belongs in `lib/server/magictodo/**`
   - client fetching should use `lib/api/client.ts` and a contract schema

Checklist:
- [ ] no direct `\"/app\"` strings (use `routes.ui.*` helpers)
- [ ] no cross-domain internal imports
- [ ] `_components` do not leak into `components/`

---

## Template: add a new API endpoint (strict)

### Example: add `POST /api/v1/tasks`

1. **Add contract(s)** in `lib/contracts/magictodo/`:
   - request schema
   - response data schema
2. **Add server service** in `lib/server/magictodo/`:
   - function that performs the operation (DB, auth checks, tenancy checks)
3. **Add/modify route handler** in:
   - `app/api/v1/(magictodo)/tasks/route.ts`
4. Ensure the handler:
   - validates input via contract helpers (not inline Zod)
   - calls service layer
   - returns `ok()` / `fail()` envelope
5. Add the endpoint path to `lib/routes.ts` under `routes.api.v1.magictodo.*`.

Checklist:
- [ ] handler has no Zod imports
- [ ] handler has no DB imports
- [ ] envelope is correct (`ok` / `fail`)
- [ ] endpoint path is in `lib/routes.ts`

---

## Template: move a component out of shared (unmix)

If a component depends on:
- auth (`useAuth`, session, user identity)
- tenancy (`tenantId`, org/team context)
- permissions/feature flags
- app-shell navigation state

Then it is **not shared**.

### Move rule
- **From**: `components/*`
- **To**:
  - app-shell owned: `app/(app)/_components/*`, or
  - route-owned: `app/**/_components/*` (preferred when it only serves one route subtree)

### Steps
1. Move the file.
2. Update all imports.
3. Remove the old export/path (no duplicates).
4. If the component was used across domains, replace it with:
   - a **pure UI shell** in `components/*`, and
   - a **domain wrapper** in the owning domain that binds auth/tenant state and passes props down.

Checklist:
- [ ] no auth/tenant hooks remain in `components/*`
- [ ] the shared component is “pure UI” (props in, events out)

---

## Template: add/extend a contract (Zod)

### Where it lives
- `lib/contracts/<domain>/*.ts`

### Rules
- Contracts are the only place Zod schemas are defined for API payloads.
- Export public schemas and derived types from a domain `index.ts`.
- Route handlers must **not** import `zod` directly; they import schemas/types from `lib/contracts/**`.

Recommended exports per endpoint:
- `<Thing>CreateRequestSchema`
- `<Thing>CreateResponseDataSchema`
- `<Thing>Schema` (for shared shapes)
- `type <Thing>CreateRequest = z.infer<typeof ...>`

Checklist:
- [ ] schema lives in the correct domain folder
- [ ] exported via `lib/contracts/<domain>/index.ts`
- [ ] used by both server validation and client validation when applicable

---

## Template: add a server service function

### Where it lives
- `lib/server/<domain>/*`

### Rules
- Must start with:

```ts
import \"@/lib/server/only\"
```

- Services perform auth + tenancy checks (via server context utilities), call DB queries, and return typed results.
- Services must not import UI code.

Checklist:
- [ ] `@/lib/server/only` imported at top
- [ ] errors are standardized (use existing API error utilities where applicable)
- [ ] no route-specific assumptions (services are reusable within the domain)

---

## Template: add a route handler (App Router `route.ts`)

### Rules (keep handlers thin)
- Parse/validate input using shared helpers + contract schemas
- Call the domain service function
- Return envelope using `ok()` / `fail()`
- Do not define Zod schemas inline
- Do not touch DB schema/client directly (use queries/services)

Checklist:
- [ ] no `zod` import
- [ ] no DB imports (`drizzle-orm`, schema, db client)
- [ ] envelope is correct for both success and error

---

## Registries + barrels (your anti-drift system)

### 1) `lib/routes.ts` (canonical paths)
- All UI paths live under `routes.ui.<domain>`
- All API paths live under `routes.api.v1.<domain>`

Rule:
- Feature code imports paths from `lib/routes.ts` (no raw strings).

### 2) Domain registries
Each domain has:
- `lib/domains/<domain>/registry.ts`

It lists:
- owned UI routes (canonical)
- owned API endpoints (canonical)
- dependencies allowed

This is the human-auditable “file registry” to prevent accidental sprawl.

### 3) Barrels
Each domain exposes only a small surface via barrels:
- `lib/contracts/<domain>/index.ts`
- `lib/server/<domain>/index.ts`
- `lib/client/<domain>/index.ts`
- `lib/shared/<domain>/index.ts`

Cross-domain imports must use barrels (or registry exports), never internals.

---

## File envelope header (mandatory)

Use this header on domain modules and shared public modules:

```ts
/**
 * @domain magictodo
 * @layer server
 * @responsibility One sentence describing why this file exists.
 * @dependencies
 * - shared
 * - contracts
 * @exports
 * - exportedSymbol()
 */
```

---

## PR checklist (definition of “done”)

- [ ] domain chosen and all files placed in that domain
- [ ] no cross-domain internal imports
- [ ] no raw `\"/app\"` or `\"/api\"` strings in feature code
- [ ] API endpoints are listed in `lib/routes.ts` and the domain registry
- [ ] API returns `ok/fail` envelope everywhere
- [ ] deleted old legacy routes/endpoints in the same change (no duplicates)
- [ ] `pnpm lint` is green
- [ ] `pnpm typecheck` is green
- [ ] `pnpm build` is green

