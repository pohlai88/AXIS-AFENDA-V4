# `lib/`

[← Back to root README](../README.md)

## Purpose

Shared application code, split by runtime:

- `lib/server/`: **server-only** code (DB, auth/tenant context, API helpers).
- `lib/client/`: client-only state and hydration utilities.
- `lib/shared/`: runtime-agnostic utilities/types.
- `lib/utils/`: Performance utilities and helper functions.

## Recent Optimizations

The `lib/` directory has been significantly optimized:

### Performance Improvements

- **Enhanced API Client** (`lib/api/client.ts`): Built-in caching, retry logic, and timeout handling
- **Optimized Database Client** (`lib/server/db/client.ts`): Connection pooling and transaction support
- **Performance Utilities** (`lib/utils.ts`): Debounce, throttle, deepClone, and more
- **Functional Error Handling** (`lib/shared/result.ts`): Result type for type-safe error management
- **Advanced Pagination** (`lib/shared/pagination.ts`): Cursor-based pagination with sorting

### Code Quality

- **Standardized Constants** (`lib/constants/`): Centralized constant library
- **Type Safety**: Full TypeScript coverage with Zod schemas
- **Documentation**: Comprehensive JSDoc documentation throughout

## Key entry points

- **Env**: `lib/env/server.ts`, `lib/env/public.ts`
- **Server-only marker**: `lib/server/only.ts` (import this to enforce server-only)
- **DB**: `lib/server/db/client.ts` (`getDb()`)
- **API**: `lib/server/api/*` (errors/response/validate)
- **Caching**: `lib/server/cache/*` (tags + invalidation helpers)
- **Performance**: `lib/utils.ts` (debounce, throttle, retry, etc.)
- **Error Handling**: `lib/shared/result.ts` (Result type)
- **Constants**: `lib/constants/index.ts` (all application constants)

## Performance Guidelines

### When to Use Optimized Features

1. **API Calls**:

   ```typescript
   import { apiFetch } from "@/lib/api/client";
   // Includes caching, retry, and timeout handling
   ```

2. **Error Handling**:

   ```typescript
   import { Result, fromPromise } from "@/lib/shared/result";
   // Type-safe error handling
   ```

3. **Performance Utilities**:

   ```typescript
   import { debounce, throttle, retry } from "@/lib/utils";
   // Optimized utility functions
   ```

4. **Constants**:
   ```typescript
   import { HEADER_NAMES, HTTP_STATUS } from "@/lib/constants";
   // No magic strings
   ```

## Subdirectory docs

- [`lib/server/`](./server/README.md)
- [`lib/client/`](./client/README.md)
- [`lib/shared/`](./shared/README.md)
- [`lib/env/`](./env/README.md)
- [`lib/api/`](./api/README.md)
- [`lib/constants/`](./constants/README.md)
- [`lib/config/`](./config/README.md)
- [`lib/contracts/`](./contracts/README.md)
- [`lib/utils/`](./utils/README.md) - Performance utilities

## Additional Documentation

- [Performance Optimization Guide](./PERFORMANCE-OPTIMIZATION-GUIDE.md)
- [Consistency Audit Report](./CONSISTENCY-AUDIT.md)
- [shadcn UI Guidelines](./shadcn-ui.md)
