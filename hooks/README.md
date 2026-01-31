# `hooks/`

[← Back to root README](../README.md)

## What lives here

- Reusable React hooks (typically client-side).
- Performance-optimized hooks using utilities from `lib/utils`.

## Available Hooks

### `use-mobile.ts`

Detects if the current viewport is mobile-sized.

```typescript
import { useMobile } from '@/hooks/use-mobile'

export default function ResponsiveLayout() {
  const isMobile = useMobile()

  return (
    <div>
      {isMobile ? <MobileNavigation /> : <DesktopNavigation />}
    </div>
  )
}
```

## Performance Optimizations

### Custom Hooks with Utilities

Create optimized hooks using the performance utilities:

```typescript
// Example: useDebouncedSearch hook
import { useState, useEffect } from "react";
import { useDebounce } from "@/lib/utils";
import { apiFetch } from "@/lib/api/client";

export function useDebouncedSearch<T>(query: string, schema: z.ZodType<T>) {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounce the query
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    apiFetch(`/api/search?q=${debouncedQuery}`, schema)
      .then(setResults)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [debouncedQuery, schema]);

  return { results, loading, error };
}
```

### Usage Example

```typescript
// In component
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { SearchResultsSchema } from '@/lib/contracts/search'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const { results, loading, error } = useDebouncedSearch(query, SearchResultsSchema)

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      {loading && <div>Searching...</div>}
      {error && <div>Error: {error.message}</div>}
      <SearchResults results={results} />
    </div>
  )
}
```

## Best Practices

### Creating Performance Hooks

1. **Use Debounce**: For user inputs that trigger API calls
2. **Use Throttle**: For high-frequency events (scroll, resize)
3. **Memoize**: Expensive computations with `useMemo`
4. **Cleanup**: Effect cleanup to prevent memory leaks

```typescript
import { useCallback, useMemo, useEffect } from "react";
import { debounce, throttle } from "@/lib/utils";

// Good: Debounced callback
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  return useCallback(debounce(callback, delay), [callback, delay]);
}

// Good: Throttled event handler
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): T {
  return useCallback(throttle(callback, delay), [callback, delay]);
}

// Good: Memoized value
export function useExpensiveValue<T>(value: T, compute: (value: T) => any) {
  return useMemo(() => compute(value), [value, compute]);
}
```

### Error Handling

Use the Result type for error handling in hooks:

```typescript
import { useState, useEffect } from "react";
import { Result, fromPromise } from "@/lib/shared/result";

export function useAsyncOperation<T, E = Error>(
  operation: () => Promise<T>,
): Result<T, E> | null {
  const [result, setResult] = useState<Result<T, E> | null>(null);

  useEffect(() => {
    fromPromise(operation())
      .then(setResult)
      .catch(() => setResult(err(new Error("Operation failed") as E)));
  }, [operation]);

  return result;
}
```

## Testing Hooks

Use React Testing Library's renderHook:

```typescript
import { renderHook, act } from "@testing-library/react";
import { useMobile } from "@/hooks/use-mobile";

// Mock window.innerWidth
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
});

test("returns false on desktop", () => {
  const { result } = renderHook(() => useMobile());
  expect(result.current).toBe(false);
});

test("returns true on mobile", () => {
  window.innerWidth = 500;
  const { result } = renderHook(() => useMobile());
  expect(result.current).toBe(true);
});
```

## Guidelines

1. **Client-Side Only**: All hooks must be client-side (add `"use client"` if in .tsx file)
2. **Performance**: Use optimized utilities from `lib/utils`
3. **Type Safety**: Full TypeScript support
4. **Error Boundaries**: Handle errors gracefully
5. **Documentation**: JSDoc comments for all hooks

## Future Hooks

Consider adding these performance-optimized hooks:

- `useInfiniteQuery` - For paginated data
- `useLocalStorage` - With debounced sync
- `useViewport` - Optimized resize observer
- `useNetworkStatus` - Debounced network checks
