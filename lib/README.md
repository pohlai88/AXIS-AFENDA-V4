# `lib/`

[← Back to root README](../README.md)

## Purpose

Shared application code, split by runtime:

- `lib/server/`: **server-only** code (DB, auth/tenant context, API helpers).
- `lib/client/`: client-only state and hydration utilities.
- `lib/shared/`: runtime-agnostic utilities/types.

## Key entry points

- **Env**: `lib/env/server.ts`, `lib/env/public.ts`
- **Server-only marker**: `lib/server/only.ts` (import this to enforce server-only)
- **DB**: `lib/server/db/client.ts` (`getDb()`)
- **API**: `lib/server/api/*` (errors/response/validate)
- **Caching**: `lib/server/cache/*` (tags + invalidation helpers)

## Subdirectory docs

- [`lib/server/`](./server/README.md)
- [`lib/client/`](./client/README.md)
- [`lib/shared/`](./shared/README.md)
- [`lib/env/`](./env/README.md)
- [`lib/api/`](./api/README.md)
- [`lib/constants/`](./constants/README.md)
- [`lib/config/`](./config/README.md)
- [`lib/contracts/`](./contracts/README.md)

