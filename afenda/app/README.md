# Afenda App (Prefix Everywhere)

## UI URL Rules

- Domain URLs are visible and prefixed: `/afenda/*`.
- No route groups for domain visibility.
- Every route folder and file is prefixed (e.g., `app/afenda-dashboard/afenda-page.tsx`).

## API URL Rules

- BFF: `/api/afenda/*`
- Public: `/api/v1/afenda/*`
- Ops/Internal: `/api/ops/afenda/*`, `/api/internal/afenda/*`, `/api/debug/afenda/*`

See [app/api/README.md](app/api/README.md) for handler rules.
