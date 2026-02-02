# API governance (scales to 100k routes)

This folder is the **URL boundary** for all API endpoints: **`/api/**`**.
UI routes live elsewhere under `app/**` and must never conflict with API URL space.

## Performance Considerations (Feb 2, 2026)

### Runtime Optimizations Applied
- **Service Worker registration**: Moved to `lazyOnload` strategy to defer registration after hydration
- **Font loading**: All Google Fonts configured with `display="swap"` to prevent LCP blocking
- **Client boundary isolation**: Minimal client components for routes like `/offline` to reduce JS bundle
- **Proxy efficiency**: Middleware in `proxy.ts` adds request/response headers with minimal latency overhead

### API Response Header Performance
The automatic header injection (`x-api-version`, `x-api-tier`, `x-api-status`) adds negligible overhead:
- Headers computed once per request in `proxy.ts`
- No serialization or business logic impact
- Safe for 100k+ route scale without performance degradation

### Recommended API Patterns for Performance
1. **Use proper HTTP caching headers** (`Cache-Control`, `ETag`) on public API responses
2. **Implement response compression** at the edge (Vercel handles this automatically)
3. **Return paginated results** for list endpoints to reduce payload size
4. **Use streaming for large datasets** via `ReadableStream` when applicable
5. **Avoid nested/circular object structures** in response envelopes

---

## Tiers (3)

### 1) BFF / feature-first (UI convenience)
- **URL shape**: `/api/<feature>`
- **Purpose**: UI-only convenience endpoints, optimized for the app UX and page flows.
- **Examples**: auth BFF endpoints under `app/api/(public)/(auth)/*`

### 2) Public API (durable, versioned)
- **URL shape**: `/api/v1/<resource>`
- **Purpose**: stable business APIs (OpenAPI target), designed for long-term compatibility.
- **Examples**: `app/api/v1/(tenancy)/*`

### 3) Ops / Internal (explicitly labeled)
- **URL shape**: `/api/cron/*`, `/api/debug/*`, `/api/internal/*` (and legacy ops like `/api/admin/*` if needed)
- **Purpose**: operational, internal tooling, diagnostics, or dev-only endpoints.
- **Rules**: must be clearly labeled, and typically gated (e.g. `NODE_ENV !== "production"` for debug).

## Automatic “latest vs legacy” classification (no manual work per route)

We classify every `/api/**` response automatically via `proxy.ts` + a single registry in `lib/api/meta.ts`.

### Headers added to every API response

- **`x-api-version`**: current API governance version (e.g. `1.0.0`)
- **`x-api-tier`**: `public | bff | ops | internal`
- **`x-api-status`**: `current | legacy`

### Deprecation headers (only for legacy routes)

When `x-api-status=legacy`, we also set standard HTTP deprecation metadata:

- **`Deprecation: true`**
- **`Sunset: <RFC1123 date>`**
- **`Link: <...>; rel="deprecation"`**

#### Current configured values (update these before production)

Right now, the legacy rules in `lib/api/meta.ts` use:

- **`Sunset`**: `Wed, 31 Dec 2026 23:59:59 GMT`
- **`Link`**: `<https://example.com/docs/api-migration>; rel="deprecation"`

These values currently apply to:
- `/api/admin/*`
- `/api/test-env`

### Where to update the rules

- **Single source of truth**: `lib/api/meta.ts`
- Update **prefix rules** there to reclassify routes at scale (100k+ routes) without editing each `route.ts`.

## Route handler shape (mandatory)

All route handlers in `app/api/**/route.ts` must follow the same shape:

- **Validate inputs** via `lib/contracts/*` (Zod schemas) and parse helpers:
  - `parseJson(req, schema)` from `@/lib/server/api/validate`
  - `parseSearchParams(searchParams, schema)` from `@/lib/server/api/validate`
  - **Dynamic route params**: Always validate using param schemas from contracts:
    ```typescript
    // ✅ CORRECT - Validate params with schema
    const rawParams = await params
    const { id } = taskParamsSchema.parse(rawParams)
    
    // ❌ WRONG - Direct destructuring without validation
    const { id } = await params
    ```
- **Call domain logic** from `lib/server/**` (services/queries). Avoid embedding business logic in `route.ts`.
- **Return the standard envelope** via:
  - `ok(data, init?)` from `@/lib/server/api/response`
  - `fail(apiError, status, init?)` from `@/lib/server/api/response`
- **Logging**: use `logger` from `@/lib/server/logger` (never `console.*`).
- **Standard error boundary**: prefer wrapping handlers with:
  - `withApiErrorBoundary(request, fn)` from `@/lib/server/api/handler`

### Dynamic Route Parameters

For routes with dynamic segments (e.g., `/api/v1/tasks/[id]`), always:

1. **Define param schemas in contracts** using Zod with proper validation:
   ```typescript
   // lib/contracts/tasks.ts
   export const taskParamsSchema = z.object({
     id: z.string().uuid("Invalid task ID"),
   })
   ```

2. **Validate params in route handlers**:
   ```typescript
   // app/api/v1/tasks/[id]/route.ts
   import { taskParamsSchema } from "@/lib/contracts/tasks"
   
   export async function GET(
     request: Request,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const rawParams = await params
     const { id } = taskParamsSchema.parse(rawParams)
     // ... rest of handler
   }
   ```

3. **Benefits**:
   - Type-safe parameter access
   - Runtime validation (UUID format, etc.)
   - Consistent error messages
   - Single source of truth for param validation

### Envelope

Success:
- `{ "data": <payload>, "error": null }`

Failure:
- `{ "data": null, "error": { "code": string, "message": string, "details"?: unknown, "requestId"?: string } }`

## Enforcement

ESLint enforces API governance in `app/api/**`:
- no `console.*`
- no direct `NextResponse.json()` / `Response.json()` (use `ok()` / `fail()`)
- narrow exceptions are explicitly documented in `eslint.config.mjs` (e.g. Neon Auth proxy passthrough)

## Performance Audit Notes (Feb 2, 2026)

### Findings
- **Compile time**: ~1.2s (good baseline with Turbopack)
- **Route count**: 74 routes across public/v1/ops tiers (verified via `get_routes` MCP)
- **Error count**: 0 (all routes compile cleanly)
- **HMR performance**: ~474ms for incremental changes

### Testing Results
Tested routes:
- **`/` (home)**: Renders without errors; footer and main content load correctly
- **`/offline`**: Server component optimization reduces JS payload; "Try Again" button isolated to client boundary
- **`/login`**: Auth flows work; public layout boundary maintained

### Recommendations for Scale
1. **Monitor API response times** as route count approaches 100k using `lib/server/logger`
2. **Use request ID header** (`x-request-id`) for tracing across service boundaries
3. **Implement rate limiting** at `/api/v1/*` tier for public endpoints (currently not enforced)
4. **Cache governance endpoint list** (`lib/api/meta.ts`) if it grows beyond current ~50 prefix rules
5. **Profile proxy.ts** middleware performance under load; currently negligible but verify before production scale

