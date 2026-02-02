# `lib/env/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Typed environment variable access for this repo (Neon Auth + Next.js).

- `server.ts`: server-only env (`getServerEnv`, `requireServerEnv`)
- `public.ts`: client-safe env (`getPublicEnv`)

## Behavior (stability)

- Values are **validated once** on first access (Zod) and then **cached** in-process.
- `requireServerEnv(key)` throws a clear error if a required value is missing.

## Server Environment (`server.ts`)

### Required (runtime)

- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`

### Optional (feature-specific)

- `DATABASE_URL` (required for DB tooling like drizzle-kit)
- `NEON_DATA_API_URL` (only if using `lib/server/neon/data-api.ts`)
- `NEON_PROJECT_ID`, `NEON_BRANCH_ID`
- `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_NEON_AUTH_URL`
- `DEV_TENANT_ID`
- `CAPTCHA_PROVIDER`, `CAPTCHA_SECRET_KEY`

### Access patterns

```typescript
import { getServerEnv, requireServerEnv } from "@/lib/env/server"

const env = getServerEnv()
const optionalDbUrl = env.DATABASE_URL

const neonAuthBaseUrl = requireServerEnv("NEON_AUTH_BASE_URL")
```

## Public Environment (`public.ts`)

Use `getPublicEnv()` for client-side safe values (must be prefixed with `NEXT_PUBLIC_`).

## Best Practices

### Environment Variable Naming

1. **Use Prefixes**:
   - `NEXT_PUBLIC_` for client-side variables
   - No prefix for server-only variables

2. **Be Descriptive**:

   ```typescript
   // Good
   DATABASE_URL;
   JWT_SECRET;
   API_TIMEOUT;

   // Bad
   DB_URL;
   SECRET;
   TIMEOUT;
   ```

3. **Group Related Variables**:

   ```typescript
   // Database
   DATABASE_URL;
   DATABASE_POOL_SIZE;
   DATABASE_TIMEOUT;

   // Redis
   REDIS_URL;
   REDIS_PREFIX;
   REDIS_TTL;
   ```

### Validation Rules

1. **Always Validate**: Use Zod schemas for validation
2. **Provide Defaults**: Where appropriate
3. **Type Coercion**: For string to number/boolean conversion

```typescript
// Good: With validation and defaults
const API_TIMEOUT: z.coerce.number().default(30000)
const ENABLE_CACHE: z.coerce.boolean().default(true)

// Bad: No validation
const API_TIMEOUT: z.string()
```

### Security Considerations

1. **Never Expose Secrets**:

   ```typescript
   // Bad: Secret in public env
   NEXT_PUBLIC_DB_PASSWORD;

   // Good: Server-only
   DB_PASSWORD;
   ```

2. **Use HTTPS URLs**:

   ```typescript
   DATABASE_URL: z.string()
     .url()
     .refine(
       (url) => url.startsWith("https://") || url.includes("localhost"),
       "Must use HTTPS in production",
     );
   ```

3. **Validate Sensitive Values**:
   ```typescript
   JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters");
   ```

## Performance Tips

### Cache Environment Access

```typescript
// Good: Import once, use multiple times
import env from "@/lib/env/server";

export function getConfig() {
  return {
    db: env.DATABASE_URL,
    jwt: env.JWT_SECRET,
  };
}

// Bad: Multiple imports
export function badConfig() {
  return {
    db: requireServerEnv().DATABASE_URL, // Validates again
    jwt: requireServerEnv().JWT_SECRET, // Validates again
  };
}
```

### Lazy Loading

```typescript
// Load expensive env vars only when needed
const getRedisConfig = () => ({
  url: getServerEnv().REDIS_URL,
  options: {
    maxRetries: getServerEnv().REDIS_MAX_RETRIES,
  },
});
```

## Usage Examples

### Database Configuration

```typescript
// lib/server/db/config.ts
import { requireServerEnv } from "@/lib/env/server";

export const dbConfig = {
  url: requireServerEnv().DATABASE_URL,
  poolSize: requireServerEnv().DATABASE_POOL_SIZE,
  ssl: process.env.NODE_ENV === "production",
};
```

### API Configuration

```typescript
// lib/api/config.ts
import { getPublicEnv } from "@/lib/env/public";

export const apiConfig = {
  baseUrl: getPublicEnv().NEXT_PUBLIC_API_URL,
  timeout: getPublicEnv().NEXT_PUBLIC_CACHE_TTL,
  retries: 3,
};
```

### Feature Flags

```typescript
// lib/feature-flags.ts
import { getServerEnv } from "@/lib/env/server";

export const features = {
  analytics: getServerEnv().ENABLE_ANALYTICS,
  cache: getServerEnv().ENABLE_CACHE,
  betaFeatures: getPublicEnv().NEXT_PUBLIC_BETA_FEATURES,
};
```

## Testing

### Mock Environment

```typescript
// __mocks__/lib/env/server.ts
export const getServerEnv = () => ({
  DATABASE_URL: "postgresql://test:test@localhost:5432/test",
  JWT_SECRET: "test-secret-that-is-at-least-32-chars",
  PORT: 3000,
});

export const requireServerEnv = getServerEnv;
```

### Test Utilities

```typescript
// test/setup.ts
import { vi } from "vitest";

vi.mock("@/lib/env/server", () => ({
  getServerEnv: () => ({
    DATABASE_URL: "test://localhost",
    JWT_SECRET: "test".repeat(10),
  }),
  requireServerEnv: () => ({
    DATABASE_URL: "test://localhost",
    JWT_SECRET: "test".repeat(10),
  }),
}));
```

## Environment Files

### Development (.env.local)

```bash
# Database
DATABASE_URL="postgresql://localhost:5432/afenda_dev"
DATABASE_POOL_SIZE=5

# Auth
JWT_SECRET="your-super-secret-jwt-key-at-least-32-chars"

# Features
ENABLE_ANALYTICS=false
ENABLE_CACHE=true
```

### Production (.env.production)

```bash
# Database
DATABASE_URL="${DATABASE_URL}"
DATABASE_POOL_SIZE=20

# Auth
JWT_SECRET="${JWT_SECRET}"

# Features
ENABLE_ANALYTICS=true
ENABLE_CACHE=true
```
