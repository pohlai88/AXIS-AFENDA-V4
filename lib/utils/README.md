# `lib/utils/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Performance utilities and helper functions used throughout the application.

## Contents

- **`utils.ts`** - Core utility functions with performance optimizations

## Available Utilities

### Performance Utilities

```typescript
import { 
  debounce, 
  throttle, 
  deepClone, 
  retry, 
  formatBytes, 
  generateId, 
  isEmpty, 
  safeJsonParse, 
  hasKey, 
  sleep 
} from '@/lib/utils'
```

#### `debounce(func, delay)`
Creates a debounced function that delays invoking `func` until after `delay` milliseconds have elapsed since the last time the debounced function was invoked.

**Example:**
```typescript
const debouncedSearch = debounce((query: string) => {
  // Perform search
}, 300)
```

#### `throttle(func, delay)`
Creates a throttled function that only invokes `func` at most once per every `delay` milliseconds.

**Example:**
```typescript
const throttledScroll = throttle(() => {
  // Handle scroll
}, 100)
```

#### `deepClone(obj)`
Creates a deep clone of an object or array.

**Example:**
```typescript
const cloned = deepClone(originalObject)
```

#### `retry(fn, options)`
Retries a function with exponential backoff.

**Options:**
- `retries`: Number of retry attempts (default: 3)
- `delay`: Initial delay in milliseconds (default: 1000)
- `factor`: Backoff multiplier (default: 2)

**Example:**
```typescript
const result = await retry(async () => {
  // Async operation that might fail
}, { retries: 5, delay: 500 })
```

### Utility Functions

#### `formatBytes(bytes, decimals)`
Formats bytes into human-readable format (KB, MB, GB, etc.).

**Example:**
```typescript
formatBytes(1024) // "1 KB"
formatBytes(1048576) // "1 MB"
```

#### `generateId(length)`
Generates a random alphanumeric ID.

**Example:**
```typescript
const id = generateId(8) // "a1b2c3d4"
```

#### `isEmpty(value)`
Checks if a value is empty (null, undefined, empty string, empty array, or empty object).

**Example:**
```typescript
isEmpty(null) // true
isEmpty("") // true
isEmpty([]) // true
isEmpty({}) // true
```

#### `safeJsonParse(json, fallback)`
Safely parses JSON with a fallback value.

**Example:**
```typescript
const parsed = safeJsonParse('{"key": "value"}', {})
const fallback = safeJsonParse('invalid', {})
```

#### `hasKey(obj, key)`
Type-safe way to check if an object has a specific key.

**Example:**
```typescript
if (hasKey(user, 'email')) {
  // TypeScript knows user.email exists
}
```

#### `sleep(ms)`
Pauses execution for the specified number of milliseconds.

**Example:**
```typescript
await sleep(1000) // Wait 1 second
```

## Best Practices

1. **Use debounce for search inputs** to avoid excessive API calls
2. **Use throttle for scroll/resize events** to improve performance
3. **Use deepClone when you need to modify objects without affecting the original**
4. **Use retry for network operations that might fail intermittently**
5. **Use safeJsonParse when dealing with external data sources**

## Performance Considerations

- All utilities are optimized for performance
- Debounce and throttle use `requestAnimationFrame` when available
- DeepClone handles circular references to prevent infinite loops
- Retry uses exponential backoff to avoid overwhelming servers

## TypeScript Support

All utilities are fully typed with TypeScript:
- Generic types where appropriate
- Strict type checking
- IntelliSense support

## Examples

### Search with Debounce
```typescript
import { debounce } from '@/lib/utils'

const searchProducts = debounce(async (query: string) => {
  if (query.length < 2) return
  const results = await apiFetch(`/api/search?q=${query}`, SearchResultsSchema)
  updateResults(results)
}, 300)

// In component
<input onChange={(e) => searchProducts(e.target.value)} />
```

### API Call with Retry
```typescript
import { retry } from '@/lib/utils'

const fetchUserData = async (userId: string) => {
  return retry(async () => {
    const response = await fetch(`/api/users/${userId}`)
    if (!response.ok) throw new Error('Failed to fetch user')
    return response.json()
  }, { retries: 3, delay: 1000 })
}
```

### Safe Configuration Parsing
```typescript
import { safeJsonParse } from '@/lib/utils'

const config = safeJsonParse(localStorage.getItem('app-config'), {
  theme: 'light',
  language: 'en'
})
```
