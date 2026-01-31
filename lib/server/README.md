# `lib/server/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Rules

- Every module here should start with:
  - `import "@/lib/server/only"`
- Do not import these modules from Client Components.
- Exception: `lib/server/db/schema/*` should **not** import `@/lib/server/only` so that `drizzle-kit` can load schema files in a plain Node context.

## Contents

- `api/`: route-handler helpers (validation + consistent response envelope).
- `auth/`, `tenant/`: request-scoped context (currently placeholders).
- `cache/`: tag naming + invalidation helpers.
- `db/`: Drizzle schema, queries, and optimized `getDb()`.

## Database Optimizations

### Enhanced Database Client (`db/client.ts`)

The database client has been optimized for performance:

#### Connection Pooling

- Up to 20 concurrent connections
- Automatic connection management
- Graceful connection release

```typescript
import { getDb, withTransaction } from "@/lib/server/db/client";

// Get database instance
const db = getDb();

// Use transactions
const result = await withTransaction(async (db) => {
  const user = await db.insert(users).values(userData).returning();
  const profile = await db.insert(profiles).values(profileData).returning();
  return { user, profile };
});
```

#### Health Checks

- Database connectivity monitoring
- Automatic reconnection on failure
- Health status reporting

```typescript
import { checkDbHealth } from "@/lib/server/db/client";

const health = await checkDbHealth();
if (!health.healthy) {
  // Handle database issues
}
```

### Query Organization

#### Edge Queries (`db/queries-edge/`)

Optimized for serverless/edge runtime:

- Uses HTTP driver for Neon
- Lower memory footprint
- Faster cold starts

```typescript
import { getUser } from "@/lib/server/db/queries-edge/user.queries";
import { getDbHttp } from "@/lib/server/db/client-neon-http";

export const runtime = "edge";

export async function GET(request: Request) {
  const db = getDbHttp();
  const user = await getUser(db, userId);
  return Response.json(user);
}
```

#### Standard Queries (`db/queries/`)

Optimized for standard Node.js runtime:

- Uses connection pooling
- Better for complex operations
- Full feature support

## API Helpers

### Error Handling (`api/errors.ts`)

Standardized HTTP error classes:

```typescript
import { BadRequest, NotFound, Unauthorized } from "@/lib/server/api/errors";

throw new BadRequest("Invalid input", { field: "email" });
throw new NotFound("User not found");
throw new Unauthorized("Access denied");
```

### Response Helpers (`api/response.ts`)

Consistent API response format:

```typescript
import { success, error } from "@/lib/server/api/response";

// Success response
return success(data, 200);

// Error response
return error("Validation failed", 400, "VALIDATION_ERROR", details);
```

### Validation (`api/validate.ts`)

Request validation helpers:

```typescript
import { validateRequest } from "@/lib/server/api/validate";
import { CreateUserSchema } from "@/lib/contracts/user";

const { data, error } = await validateRequest(request, CreateUserSchema);
if (error) return error;
```

## Caching System

### Cache Tags (`cache/tags.ts`)

Centralized cache tag definitions:

```typescript
import { CACHE_TAGS } from "@/lib/server/cache/tags";

// Use in API routes
revalidateTag(CACHE_TAGS.USER_LIST);
revalidateTag(CACHE_TAGS.USER_DETAIL(userId));
```

### Invalidation Helpers (`cache/revalidate.ts`)

Cache invalidation utilities:

```typescript
import { invalidateTag, invalidatePath } from "@/lib/server/cache/revalidate";

// Invalidate by tag
await invalidateTag(CACHE_TAGS.PROJECTS);

// Invalidate by path
await invalidatePath("/api/users");
```

## Performance Guidelines

### Database Best Practices

1. **Use Transactions**: For multi-statement operations
2. **Connection Pooling**: Automatic with `getDb()`
3. **Edge Queries**: Use for serverless/edge functions
4. **Health Checks**: Monitor in production

```typescript
// Good: Transaction with rollback
await withTransaction(async (db) => {
  await db.insert(users).values(user);
  await db.insert(profiles).values(profile);
});

// Good: Edge query for simple operations
import { getDbHttp } from "@/lib/server/db/client-neon-http";
const db = getDbHttp();
```

### API Best Practices

1. **Validate Input**: Use Zod schemas
2. **Handle Errors**: Use standardized error classes
3. **Cache Responses**: Use appropriate cache tags
4. **Rate Limit**: Implement where needed

### Caching Best Practices

1. **Tag Strategy**: Group related data
2. **Invalidation**: Clear stale data promptly
3. **TTL**: Use appropriate cache durations
4. **Revalidation**: Use Next.js revalidation APIs

## Environment Variables

Server environment access:

```typescript
import { getServerEnv, requireServerEnv } from "@/lib/env/server";

// Optional with default
const dbUrl = getServerEnv().DATABASE_URL;

// Required (throws if missing)
const secret = requireServerEnv().JWT_SECRET;
```

## Security Considerations

1. **Server-Only**: Always import `@/lib/server/only`
2. **No Client Imports**: Prevent server code in client bundles
3. **Env Variables**: Use server env helpers
4. **SQL Injection**: Use Drizzle parameterized queries
5. **Rate Limiting**: Implement API rate limits
