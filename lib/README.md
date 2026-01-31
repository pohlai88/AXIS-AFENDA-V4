# `lib/`

[← Back to root README](../README.md)

## Purpose

Shared application code, split by runtime and purpose:

- `lib/server/`: **server-only** code (DB, auth/tenant context, API helpers).
- `lib/client/`: client-only state and hydration utilities.
- `lib/shared/`: runtime-agnostic utilities/types.
- `lib/auth/`: authentication utilities for both client and server.
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
- **Auth**: `lib/auth/client.ts`, `lib/auth/server.ts` (authentication utilities)
- **Caching**: `lib/server/cache/*` (tags + invalidation helpers)
- **Performance**: `lib/utils.ts` (debounce, throttle, retry, etc.)
- **Error Handling**: `lib/shared/result.ts` (Result type)
- **Constants**: `lib/constants/index.ts` (all application constants)
- **Routes**: `lib/routes.ts` (application route definitions)

## Constants Structure

The `lib/constants/` directory provides centralized, typed constants:

### Main Constants (`lib/constants/index.ts`)

- **HTTP_STATUS**: All HTTP status codes with TypeScript types
- **API_ERROR_CODES**: Standardized error codes for API responses
- **COOKIE_NAMES**: Application cookie identifiers
- **TIME_INTERVALS**: Time values in ms (SECOND, MINUTE, HOUR, etc.)
- **PAGINATION**: Pagination defaults and limits
- **CACHE_TTL**: Cache duration presets
- **REGEX_PATTERNS**: Common validation patterns (email, UUID, password)
- **DATE_FORMATS**: Standard date/time format strings
- **ENVIRONMENTS**: Environment names (development, production, etc.)
- **LOGGER**: Logging configuration defaults
- **CIRCUIT_BREAKER**: Network failure protection defaults

### Specialized Constants

- **headers.ts**: HTTP header names (x-request-id, x-tenant-id, etc.)
- **storage.ts**: LocalStorage/sessionStorage key paths

All constants include:

- TypeScript exports with proper typing
- JSDoc documentation
- Backward compatibility where needed
- No magic strings - everything is centralized

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
   import {
     HEADER_NAMES, // HTTP headers (x-request-id, x-tenant-id, etc.)
     HTTP_STATUS, // Status codes (OK: 200, NOT_FOUND: 404, etc.)
     API_ERROR_CODES, // Error codes (UNAUTHORIZED, VALIDATION_ERROR, etc.)
     COOKIE_NAMES, // Cookie names (TENANT_ID, THEME, etc.)
     STORAGE_KEYS, // Storage keys for localStorage/sessionStorage
     TIME_INTERVALS, // Time intervals (SECOND, MINUTE, HOUR, etc.)
     PAGINATION, // Pagination defaults and limits
     CACHE_TTL, // Cache TTL values (VERY_SHORT, SHORT, etc.)
     REGEX_PATTERNS, // Validation patterns (EMAIL, UUID, PASSWORD, etc.)
     DATE_FORMATS, // Date formats (ISO_DATE, DISPLAY_DATE, etc.)
     ENVIRONMENTS, // Environment names (DEVELOPMENT, PRODUCTION, etc.)
     LOGGER, // Logging defaults and configuration
     CIRCUIT_BREAKER, // Circuit breaker defaults for network calls
   } from "@/lib/constants";
   // No magic strings - all constants are typed and documented
   ```

5. **Authentication**:
   ```typescript
   import { authClient } from "@/lib/auth/client";
   import { getServerSession } from "@/lib/auth/server";
   // Authentication helpers for client and server
   ```

## Subdirectory docs

- [`lib/server/`](./server/README.md)
- [`lib/client/`](./client/README.md)
- [`lib/shared/`](./shared/README.md)
- [`lib/auth/`](./auth/) - Authentication utilities (client & server)
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
