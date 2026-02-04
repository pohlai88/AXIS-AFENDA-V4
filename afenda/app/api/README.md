# API Governance (Afenda Bootstrap)

## Tiers (3) — All Prefixed

1) **BFF (feature-first)**
- URL: `/api/afenda/*`
- UI convenience endpoints, short-lived.

2) **Public API (versioned)**
- URL: `/api/v1/afenda/*`
- Durable, backward-compatible.

3) **Ops/Internal**
- URL: `/api/ops/afenda/*`, `/api/internal/afenda/*`, `/api/debug/afenda/*`
- Gated, internal-only.

---

## Mandatory Route Handler Shape

- Validate inputs via Zod in `packages/afenda/src/zod/afenda.contract.ts`.
- Call domain service in `packages/afenda/src/server/afenda.service.ts`.
- Return standard envelope:
  - Success: `{ data, error: null }`
  - Failure: `{ data: null, error: { code, message, details?, requestId? } }`
- Use a standard error boundary wrapper (no `console.*`).
