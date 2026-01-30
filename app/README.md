# `app/`

[← Back to root README](../README.md)

## What lives here

- **App Router routes and layouts** (`layout.tsx`, `page.tsx`, route handlers in `app/api/**/route.ts`)
- Route-segment colocation (components or helpers near routes, if needed)

## Route groups / URLs

This app uses route groups:

- `(public)`: public pages like `/` and `/login`
- `(app)`: the authenticated app shell under `/app/*`

Key routes:

- `/`: public home
- `/login`: auth entry
- `/app`: authenticated shell home
- `/app/modules`: module registry
- `/app/modules/[slug]`: iframe/embed modules
- `/components`: UI playground
- `/api/v1/*`: API routes using the standard envelope

## Notes

- Route handlers should use `lib/server/api/*` helpers for consistent envelopes.
- Request headers like `x-request-id` and (optionally) `x-tenant-id` are injected by the proxy middleware in `proxy.ts`.

