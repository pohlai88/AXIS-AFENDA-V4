# `lib/api/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Client-side API helpers with enhanced performance features.

- `client.ts`: Enhanced `apiFetch` with caching, retry, and timeout handling
- `endpoints.ts`: Central API route path builders

## Features

### Enhanced API Client (`client.ts`)

The API client has been optimized with performance features:

#### Caching

- In-memory cache for GET requests (5-minute TTL)
- Cache management utilities (`clearCache`, `preloadCache`)
- Reduces redundant API calls

#### Retry Logic

- Automatic retry with exponential backoff
- Configurable retry attempts and delays
- Handles intermittent network failures

#### Timeout Handling

- 30-second default timeout
- Prevents hanging requests
- Configurable per request

#### Type Safety

- Zod schema validation
- Typed error responses
- Full TypeScript support

### Usage Examples

```typescript
import { apiFetch, clearCache } from "@/lib/api/client";
import { UserSchema } from "@/lib/contracts/user";

// Basic usage with caching
const user = await apiFetch("/api/users/123", {}, UserSchema);

// Custom options
const result = await apiFetch(
  "/api/data",
  {
    method: "POST",
    retries: 5,
    timeout: 10000,
    cacheKey: "custom-key",
  },
  DataSchema,
);

// Clear cache when needed
clearCache();
clearCache("/api/users"); // Clear specific endpoint
```

### Error Handling

The API client provides detailed error information:

```typescript
import { ApiFetchError } from "@/lib/api/client";

try {
  const data = await apiFetch("/api/data", {}, DataSchema);
} catch (error) {
  if (error instanceof ApiFetchError) {
    console.error("API Error:", error.code);
    console.error("Details:", error.details);
    console.error("Request ID:", error.requestId);
  }
}
```

## API Endpoints (`endpoints.ts`)

Centralized endpoint builders to avoid hardcoded paths:

```typescript
import { endpoints } from "@/lib/api/endpoints";

// Dynamic endpoints
const userUrl = endpoints.users.show("123"); // "/api/users/123"
const taskUrl = endpoints.tasks.list({ status: "active" }); // "/api/tasks?status=active"

// Nested routes
const projectTaskUrl = endpoints.projects.tasks("456", "789"); // "/api/projects/456/tasks/789"
```

## Performance Guidelines

### When to Use Caching

- GET requests that don't change frequently
- Reference data (e.g., user profiles, settings)
- Dashboard data with periodic refreshes

### When to Disable Caching

- POST/PUT/DELETE requests
- Real-time data
- Sensitive information

### Cache Management

```typescript
// Clear all cache
clearCache();

// Clear specific endpoint
clearCache("/api/users");

// Preload cache
await preloadCache("/api/dashboard", DashboardSchema);
```

## Best Practices

1. **Always use schemas**: Define Zod schemas for all API responses
2. **Handle errors gracefully**: Use try/catch with ApiFetchError
3. **Manage cache**: Clear cache when data becomes stale
4. **Use endpoints**: Avoid hardcoded API paths
5. **Set appropriate timeouts**: Adjust based on expected response times

## Configuration

Default settings can be adjusted in `client.ts`:

- Cache TTL: 5 minutes
- Retry attempts: 3
- Timeout: 30 seconds
- Backoff factor: 2

## Type Safety

All API interactions are fully typed:

- Request/response schemas with Zod
- Error types with detailed information
- Endpoint path builders with type checking
