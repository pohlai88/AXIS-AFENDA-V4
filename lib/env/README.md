# `lib/env/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Typed environment variable access with performance optimizations and validation.

- `server.ts`: server-only env (`getServerEnv`, `requireServerEnv`)
- `public.ts`: client-safe env (`getPublicEnv`)

## Performance Optimizations

### Cached Environment Access

Environment variables are cached after first access for better performance:

```typescript
import { getServerEnv } from "@/lib/env/server";

// First access - reads from process.env
const env1 = getServerEnv();

// Subsequent accesses - returns cached value
const env2 = getServerEnv(); // Fast!
```

### Validation at Runtime

Environment variables are validated on first access:

```typescript
// Validates all required variables on first use
const env = getServerEnv();
// Throws if required variables are missing
```

## Server Environment (`server.ts`)

### Access Patterns

```typescript
import { getServerEnv, requireServerEnv } from "@/lib/env/server";

// Optional access with defaults
const dbUrl = getServerEnv().DATABASE_URL;
const port = getServerEnv().PORT || 3000;

// Required access (throws if missing)
const jwtSecret = requireServerEnv().JWT_SECRET;
const dbUrl = requireServerEnv().DATABASE_URL;
```

### Environment Schema

```typescript
const ServerEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().default(20),

  // Auth
  JWT_SECRET: z.string().min(32),
  AUTH_URL: z.string().url().optional(),

  // External services
  REDIS_URL: z.string().url().optional(),
  EMAIL_FROM: z.string().email(),

  // Feature flags
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  ENABLE_CACHE: z.coerce.boolean().default(true),

  // Performance
  API_TIMEOUT: z.coerce.number().default(30000),
  MAX_RETRIES: z.coerce.number().default(3),
});
```

## Public Environment (`public.ts`)

### Access Patterns

```typescript
import { getPublicEnv } from "@/lib/env/public";

// Safe client-side access
const env = getPublicEnv();
const apiUrl = env.NEXT_PUBLIC_API_URL;
const siteName = env.NEXT_PUBLIC_SITE_NAME;
```

### Public Environment Schema

```typescript
const PublicEnvSchema = z.object({
  // Site configuration
  NEXT_PUBLIC_SITE_NAME: z.string().default("AFENDA"),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_API_URL: z.string().url(),

  // Feature flags
  NEXT_PUBLIC_BETA_FEATURES: z.coerce.boolean().default(false),
  NEXT_PUBLIC_DEBUG_MODE: z.coerce.boolean().default(false),

  // External services
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),

  // Performance
  NEXT_PUBLIC_CACHE_TTL: z.coerce.number().default(300000),
});
```

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
