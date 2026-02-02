# Server-Side Caching Utilities

This directory contains server-side caching utilities using Next.js `unstable_cache` for persistent data caching.

## Purpose

While React `cache` provides **request-scoped memoization** (lasts only during a single request), `unstable_cache` provides **persistent caching** across multiple requests and deployments.

## Usage Patterns

### When to Use React `cache`
- Deduplicating database queries within a single request
- Preventing multiple JWT verifications for the same token
- Memoizing expensive computations during rendering
- **Duration**: Per-request lifecycle only

### When to Use `unstable_cache`
- Caching data that rarely changes (e.g., user profiles, settings)
- Expensive database aggregations
- External API calls with predictable data
- **Duration**: Persistent across requests (configurable TTL)

## Example

```typescript
import { unstable_cache } from 'next/cache'

export const getCachedUserProfile = unstable_cache(
  async (userId: string) => {
    // Expensive operation
    return await db.query.users.findFirst({ where: eq(users.id, userId) })
  },
  ['user-profile'], // Cache key prefix
  {
    revalidate: 60, // Revalidate after 60 seconds
    tags: ['user'], // For on-demand revalidation
  }
)
```

## Revalidation Strategies

### Time-Based
```typescript
{ revalidate: 3600 } // 1 hour
```

### Tag-Based (On-Demand)
```typescript
import { revalidateTag } from 'next/cache'

// In your mutation handler
await updateUserProfile(userId, data)
revalidateTag('user') // Invalidate all caches tagged with 'user'
```

## Best Practices

1. **Use specific cache keys**: Include all parameters that affect the result
2. **Set appropriate TTLs**: Balance freshness vs. performance
3. **Tag for invalidation**: Always tag caches that need on-demand revalidation
4. **Document TTLs**: Explain why a particular TTL was chosen

## References

- [Next.js Data Cache](https://nextjs.org/docs/app/guides/caching#data-cache)
- [unstable_cache API](https://nextjs.org/docs/app/api-reference/functions/unstable_cache)
