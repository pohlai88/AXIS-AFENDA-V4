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

### Env and .env (mandatory safety)

- **Never overwrite or delete `.env` without explicit user approval.**
- **Before any operation that would modify or replace `.env`**, run `pnpm env:backup` so the user can restore with `pnpm env:restore` if needed.
- Do not delete `.env.example`; it is the only committed template. App and tooling use `.env` (single env file).

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

## Domain-based architecture (strict organizational rules)

### Core principle: Everything belongs to a domain

**ALL pages, layouts, and components must live within their designated domain route group.**
Direct placement at `app/` root (except `layout.tsx`, `globals.css`, `not-found.tsx`, error boundaries) is **PROHIBITED**.

### Domain structure

```
app/
├── layout.tsx                    ✅ Root layout (loads globals.css, providers)
├── globals.css                   ✅ Global styles (Tailwind base/utilities)
├── not-found.tsx                 ✅ Global 404
├── global-error.tsx              ✅ Global error boundary
├── _components/                  ✅ Shared cross-domain components
│
├── (public)/                     📁 DOMAIN: Public-facing pages
│   ├── (auth)/                   📁 SUB-DOMAIN: Authentication & account
│   │   ├── auth/                 🔐 Neon Auth pages
│   │   │   └── [path]/page.tsx   → /auth/sign-in, /auth/sign-up, etc.
│   │   ├── account/              🔐 Account management
│   │   │   └── [path]/page.tsx   → /account/settings, /account/security
│   │   ├── login/                🔐 Legacy login (if exists)
│   │   ├── register/             🔐 Legacy register (if exists)
│   │   └── forgot-password/      🔐 Password reset flows
│   ├── layout.tsx                ✅ Public layout wrapper
│   └── page.tsx                  → / (landing page)
│
├── (app)/                        📁 DOMAIN: Authenticated application
│   ├── app/                      🔒 Main app routes
│   │   └── page.tsx              → /app (dashboard)
│   ├── tenancy/                  🔒 Multi-tenancy features
│   │   ├── organizations/        → /app/tenancy/organizations
│   │   └── teams/                → /app/tenancy/teams
│   ├── management/               🔒 Management features
│   ├── layout.tsx                ✅ App shell (sidebar, header, breadcrumbs)
│   └── _components/              ✅ App-specific components
│
└── api/                          📁 DOMAIN: API routes
    └── v1/                       → /api/v1/*
```

### Domain rules (what you can/cannot do)

#### ✅ ALLOWED within domains

**Within `(public)/` domain:**
- Marketing pages, landing pages, about, pricing
- Authentication flows (delegated to `(public)/(auth)/` sub-domain)
- Public documentation, blogs, legal pages
- Uses: `globals.css`, public marketing components
- Layout: Minimal wrapper, no app shell

**Within `(public)/(auth)/` sub-domain:**
- Authentication pages: `/auth/sign-in`, `/auth/sign-up`, `/auth/sign-out`
- Account management: `/account/settings`, `/account/security`
- Password reset flows, email verification
- Uses: Neon Auth built-in CSS (NO custom layout wrappers)
- Styling: AuthView/AccountView components handle their own layout

**Within `(app)/` domain:**
- Authenticated application features
- Dashboard, analytics, data tables
- Multi-tenancy: organizations, teams, workspaces
- Management: users, roles, permissions, settings
- Uses: App shell layout (sidebar, header, breadcrumbs), `globals.css`
- Requires: User session/authentication

**Within `api/` domain:**
- RESTful API endpoints
- Versioned routes (`v1/`, `v2/`)
- No pages or UI components allowed
- Returns: JSON envelopes (standardized via `lib/server/api/*`)

#### ❌ PROHIBITED at app root

**DO NOT create these at `app/` root:**
- ❌ `app/auth/` (must be `app/(public)/(auth)/auth/`)
- ❌ `app/account/` (must be `app/(public)/(auth)/account/`)
- ❌ `app/login/` (must be inside `(public)/(auth)/`)
- ❌ `app/dashboard/` (must be `app/(app)/app/`)
- ❌ Any page.tsx outside domain route groups
- ❌ Custom layout.tsx for auth pages (Neon Auth has built-in layouts)

**ONLY allowed at app root:**
- ✅ `layout.tsx` - Root layout (providers, globals.css)
- ✅ `globals.css` - Global styles
- ✅ `not-found.tsx` - Global 404 handler
- ✅ `global-error.tsx` - Global error boundary
- ✅ `_components/` - Shared cross-domain components
- ✅ `opengraph-image.tsx`, `twitter-image.tsx` - Social metadata
- ✅ `sw.ts` - Service worker (PWA)

### Route collision prevention

**Critical rule:** Never create two pages that resolve to the same URL path.

**Example of violation:**
```
❌ app/register/page.tsx          → /register
❌ app/(public)/register/page.tsx → /register
    (CONFLICT - both resolve to /register)
```

**Correct approach:**
```
✅ app/(public)/(auth)/register/page.tsx → /register
   (Single source of truth)
```

**Before adding a new route:**
1. Search codebase for existing pages with same path
2. Check all route groups `(public)`, `(app)`, `(admin)`
3. Remember: Route groups don't change URLs (they're organizational only)

### Domain-specific styling rules

#### Auth pages (`(public)/(auth)/auth/*`, `(public)/(auth)/account/*`)
- **CSS Source**: Neon Auth built-in CSS (loaded by components)
- **Custom Layouts**: ❌ PROHIBITED (creates wrapper conflicts)
- **Custom Styles**: Only for navigation headers (use `globals.css`)
- **Components**: `<AuthView />`, `<AccountView />` (from `@neondatabase/auth/react`)

**Pattern for account pages:**
```tsx
// ✅ CORRECT: Integrated header + Neon Auth component
return (
  <div className="min-h-screen">
    {/* Custom header - uses globals.css */}
    <div className="border-b">
      <Link href="/app">← Back to App</Link>
    </div>
    {/* Neon Auth component - uses built-in CSS */}
    <AccountView path={path} />
  </div>
);
```

```tsx
// ❌ WRONG: Wrapper layout interferes with Neon Auth
// app/(public)/(auth)/account/layout.tsx
export default function Layout({ children }) {
  return <div className="container">{children}</div>; // ❌ Conflict!
}
```

#### App pages (`(app)/*`)
- **CSS Source**: `globals.css` (Tailwind utilities)
- **Layout**: App shell (`(app)/layout.tsx`) with sidebar, header, breadcrumbs
- **Components**: shadcn/ui components, custom app components
- **Auth**: Required (protected routes)

#### Public pages (`(public)/*`)
- **CSS Source**: `globals.css`, custom marketing styles
- **Layout**: Minimal wrapper (`(public)/layout.tsx`)
- **Components**: Marketing components, hero sections, CTAs
- **Auth**: Not required (public access)

### Domain migration checklist

When moving existing files to correct domains:

1. **Identify domain:**
   - Auth/account? → `(public)/(auth)/`
   - Authenticated feature? → `(app)/`
   - Public marketing? → `(public)/`
   - API endpoint? → `api/v1/`

2. **Move files:**
   ```powershell
   # Example: Moving auth folder
   Move-Item -Path "app\auth" -Destination "app\(public)\(auth)\auth"
   ```

3. **Remove wrapper layouts:**
   - Delete `layout.tsx` files that wrap Neon Auth components
   - Integrate navigation into page components instead

4. **Update imports:**
   - Check for hardcoded paths in redirects
   - Update internal links/hrefs
   - Verify auth provider `redirectTo` paths

5. **Test routing:**
   - Verify URLs still resolve correctly
   - Check browser navigation works
   - Test authentication flows end-to-end

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

- **Import DB from the barrel**: `import { getDb, getDbClient, withTransaction } from "@/lib/server/db"`
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

- **Never create two pages that resolve to the same path** (see Domain rules above for examples).
- **All pages must belong to a domain route group**: `(public)`, `(app)`, or `api`.
- **Route groups are organizational only** - they do not change the URL path.
- **Auth pages belong in `(public)/(auth)/`** - never at app root.
- When adding a new route, search for existing pages/handlers that would collide.
- Follow the domain-based architecture strictly to prevent drift.

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

- **App shell routes**: `app/(app)/app/*` → `/app/*`
- **Public routes**: `app/(public)/*` → `/*`
- **Auth routes**: `app/(public)/(auth)/auth/*` → `/auth/*`
- **Account routes**: `app/(public)/(auth)/account/*` → `/account/*`
- **API v1**: `app/api/v1/*` → `/api/v1/*`

**Remember**: Route groups `(...)` are removed from URLs - they're for organization only.

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
