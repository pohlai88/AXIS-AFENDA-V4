# `lib/shared/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Runtime-agnostic helpers (safe to import from both server and client) with enhanced error handling and type safety.

## Contents

### Core Modules

#### `result.ts` - Functional Error Handling

Provides a Result type for type-safe error handling without exceptions.

```typescript
import { Result, ok, err, fromPromise } from "@/lib/shared/result";

// Creating results
const success = ok(data);
const failure = err(error);

// Working with async operations
const result = await fromPromise(riskyOperation());

// Functional composition
const mapped = result.map((data) => data.transformed);
```

#### `pagination.ts` - Advanced Pagination

Cursor-based pagination with sorting support.

```typescript
import {
  PaginationQuerySchema,
  buildPaginationQuery,
} from "@/lib/shared/pagination";

// Validate pagination params
const query = PaginationQuerySchema.parse(req.query);

// Build database query
const dbQuery = buildPaginationQuery(query, {
  defaultSort: "createdAt",
  defaultOrder: "desc",
});
```

#### `permissions.ts` - Authorization Helpers

Type-safe permission checking with Zod schemas.

```typescript
import {
  hasPermission,
  AuthorizationContextSchema,
} from "@/lib/shared/permissions";

// Check permissions
if (hasPermission(context, "tasks.create")) {
  // Allow action
}

// Validate context
const context = AuthorizationContextSchema.parse(data);
```

#### `invariant.ts` - Assertion Helpers

Runtime assertions with custom error types.

```typescript
import { validateInvariant, InvariantError } from "@/lib/shared/invariant";

// Assert conditions
validateInvariant(user !== null, "User must be logged in");

// Custom error handling
try {
  validateInvariant(condition, "Message");
} catch (error) {
  if (error instanceof InvariantError) {
    // Handle invariant error
  }
}
```

### Type Definitions

#### `id.ts` - ID Type Schemas

Zod schemas for ID validation.

```typescript
import { IdSchema, TenantIdSchema } from "@/lib/shared/id";

// Validate IDs
const id = IdSchema.parse("123");
const tenantId = TenantIdSchema.parse("tenant-456");
```

#### `modules.ts` - Module Definitions

Shared module type definitions.

#### `colors.ts` - Color Utilities

Color manipulation and validation utilities.

#### `design-system/` - Design System

- `palettes.ts` - Color palettes
- `css.ts` - CSS-in-JS utilities

## Recent Enhancements

### Error Handling Improvements

- **Result Type**: Functional error handling without try/catch
- **Composition Helpers**: `map`, `flatMap`, `mapErr` for functional programming
- **Promise Wrappers**: `fromPromise`, `fromThrowable` for async operations

### Type Safety

- **Zod Schemas**: All types have validation schemas
- **Type Guards**: Runtime type checking utilities
- **Generic Types**: Flexible, reusable type definitions

### Performance

- **Lightweight**: Minimal runtime overhead
- **Tree-shakable**: Unused code is eliminated
- **Zero Dependencies**: No external runtime dependencies

## Usage Patterns

### Error Handling with Result Type

```typescript
// Instead of try/catch
async function getUser(id: string): Promise<Result<User, Error>> {
  return fromPromise(async () => {
    const user = await db.user.findUnique({ where: { id } });
    if (!user) throw new Error("User not found");
    return user;
  });
}

// Usage
const result = await getUser("123");
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error);
}
```

### Permission Checking

```typescript
// Define permissions
const permissions = ["tasks.create", "tasks.edit", "tasks.delete"];

// Check in middleware
function checkPermission(context: AuthorizationContext, permission: string) {
  if (!hasPermission(context, permission)) {
    throw new ForbiddenError("Insufficient permissions");
  }
}
```

### Pagination Implementation

```typescript
// API route
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = PaginationQuerySchema.parse({
    page: searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    cursor: searchParams.get("cursor"),
    sort: searchParams.get("sort"),
    order: searchParams.get("order"),
  });

  const { data, meta } = await getTasks(query);
  return Response.json({ data, meta });
}
```

## Best Practices

1. **Use Result Type**: For operations that might fail
2. **Validate Early**: Use Zod schemas at boundaries
3. **Check Permissions**: Use `hasPermission` for authorization
4. **Use Invariants**: For internal assertions
5. **Type Safety**: Leverage TypeScript generics

## Migration Notes

Legacy patterns are still supported but deprecated:

- `can()` → `hasPermission()`
- `invariant()` → `validateInvariant()`
- Direct exceptions → Result type
