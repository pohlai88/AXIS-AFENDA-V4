# Afenda Bootstrap (Prefix Everywhere)

## Rules (Hardcoded)

1) **Prefix everywhere (domain + app)**
- Every domain/app folder and filename starts with `afenda`.
- Anything without prefix is **orphan**, except shared packages under `packages/shadcn`.

2) **Tool-driven folders**
- Drizzle → `drizzle/`
- Zod → `zod/`
- Zustand → `zustand/`
- Server logic → `server/`
- Client UI → `component/client/`
- Server UI → `component/server/`

3) **API tiers (all prefixed)**
- BFF: `/api/afenda/*`
- Public: `/api/v1/afenda/*`
- Ops/Internal: `/api/ops/afenda/*`, `/api/internal/afenda/*`, `/api/debug/afenda/*`

4) **No cross-domain imports**
- Domains never import each other directly.
- Orchestration happens only at app-level routes.

## Bootstrap Layout

```
afenda/
  app/
    api/
  packages/
    shadcn/       (shared, unprefixed)
    afenda/       (domain, prefix everywhere)
```

## New Domain Copy

1) Duplicate `packages/afenda` to `packages/<domain>`.
2) Replace every `afenda` prefix in filenames and paths with `<domain>`.
3) Add `/api/<domain>`, `/api/v1/<domain>`, `/api/ops/<domain>` routes.
4) Keep all tool folders in every domain: `drizzle/`, `zod/`, `zustand/`, `server/`, `component/client/`, `component/server/`.
