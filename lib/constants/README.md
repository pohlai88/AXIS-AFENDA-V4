# `lib/constants/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Centralized constants used across the app to ensure consistency and avoid magic strings.

## Structure

```
lib/constants/
├── index.ts      # Main constants file with all standardized constants
├── headers.ts    # HTTP header constants (legacy, moving to index.ts)
├── storage.ts    # Storage key constants (enhanced with new patterns)
└── README.md     # This documentation file
```

## Available Constants

### 1. HEADER_NAMES

Standard HTTP headers used throughout the application.

```typescript
import { HEADER_NAMES } from "@/lib/constants";

// Usage
requestHeaders.set(HEADER_NAMES.REQUEST_ID, requestId);
requestHeaders.set(HEADER_NAMES.TENANT_ID, tenantId);
```

### 2. COOKIE_NAMES

All cookie names used in the application.

```typescript
import { COOKIE_NAMES } from "@/lib/constants";

// Usage
res.cookies.set(COOKIE_NAMES.THEME, "dark");
const tenantId = req.cookies.get(COOKIE_NAMES.TENANT_ID)?.value;
```

### 3. HTTP_STATUS

Standard HTTP status codes.

```typescript
import { HTTP_STATUS } from "@/lib/constants";

// Usage
if (response.status === HTTP_STATUS.NOT_FOUND) {
  // Handle not found
}
```

### 4. API_ERROR_CODES

Standardized API error codes for consistent error handling.

```typescript
import { API_ERROR_CODES } from "@/lib/constants";

// Usage
throw new ApiError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid input");
```

### 5. TIME_INTERVALS

Common time intervals in milliseconds.

```typescript
import { TIME_INTERVALS } from "@/lib/constants";

// Usage
setTimeout(() => {}, TIME_INTERVALS.MINUTE);
```

### 6. PAGINATION

Pagination defaults and limits.

```typescript
import { PAGINATION } from "@/lib/constants";

// Usage
const pageSize = Math.min(query.pageSize, PAGINATION.MAX_PAGE_SIZE);
```

### 7. CACHE_TTL

Cache time-to-live values.

```typescript
import { CACHE_TTL } from "@/lib/constants";

// Usage
cache.set(key, value, CACHE_TTL.SHORT);
```

### 8. REGEX_PATTERNS

Common regular expression patterns.

```typescript
import { REGEX_PATTERNS } from "@/lib/constants";

// Usage
if (!REGEX_PATTERNS.EMAIL.test(input)) {
  throw new Error("Invalid email");
}

// Username validation
if (!REGEX_PATTERNS.USERNAME.test(username)) {
  throw new Error("Invalid username");
}
```

### 9. DATE_FORMATS

Standard date and time formats.

```typescript
import { DATE_FORMATS } from "@/lib/constants";

// Usage
date.format(DATE_FORMATS.DISPLAY_DATE);
```

### 10. ENVIRONMENTS

Environment names.

```typescript
import { ENVIRONMENTS } from "@/lib/constants";

// Usage
if (process.env.NODE_ENV === ENVIRONMENTS.PRODUCTION) {
  // Production-only logic
}
```

### 11. MIME_TYPES

Common MIME types.

```typescript
import { MIME_TYPES } from "@/lib/constants";

// Usage
res.setHeader("Content-Type", MIME_TYPES.JSON);
```

### 12. DB_LIMITS

Database query limits.

```typescript
import { DB_LIMITS } from "@/lib/constants";

// Usage
query.limit(DB_LIMITS.MAX_SELECT_ROWS);
```

### 13. FILE_UPLOAD

File upload constraints.

```typescript
import { FILE_UPLOAD } from "@/lib/constants";

// Usage
if (file.size > FILE_UPLOAD.MAX_FILE_SIZE) {
  throw new Error("File too large");
}
```

### 14. STORAGE_KEYS

Storage keys for localStorage and sessionStorage.

```typescript
import { STORAGE_KEYS } from "@/lib/constants";

// Usage
localStorage.setItem(STORAGE_KEYS.UI.THEME, "dark");
```

## Migration Guide

### From Legacy Constants

#### Headers

```typescript
// Before
import { headerNames } from "@/lib/constants/headers";
requestHeaders.set(headerNames.requestId, id);

// After
import { HEADER_NAMES } from "@/lib/constants";
requestHeaders.set(HEADER_NAMES.REQUEST_ID, id);
```

#### Cookies

```typescript
// Before
const TENANT_COOKIE = "afenda_tenant_id";
req.cookies.get(TENANT_COOKIE);

// After
import { COOKIE_NAMES } from "@/lib/constants";
req.cookies.get(COOKIE_NAMES.TENANT_ID);
```

#### Storage

```typescript
// Before
import { storageKeys } from "@/lib/constants/storage";
localStorage.setItem(storageKeys.ui.sidebarState, "collapsed");

// After
import { STORAGE_KEYS } from "@/lib/constants";
localStorage.setItem(STORAGE_KEYS.UI.SIDEBAR_STATE, "collapsed");
```

## Adding New Constants

When adding new constants:

1. **Use UPPER_CASE for constant names**
2. **Group related constants together**
3. **Add JSDoc comments explaining the purpose**
4. **Export TypeScript types for the constants**
5. **Provide legacy exports if replacing existing constants**
6. **Update this documentation**

Example:

```typescript
/**
 * New feature constants.
 */
export const NEW_FEATURE = {
  /** Maximum number of items */
  MAX_ITEMS: 100,
  /** Default timeout */
  DEFAULT_TIMEOUT: 5000,
} as const;

export type NewFeatureKey = keyof typeof NEW_FEATURE;
export type NewFeatureValue = (typeof NEW_FEATURE)[NewFeatureKey];
```

## Best Practices

1. **Import from the main index file** when possible:

   ```typescript
   import { HEADER_NAMES, COOKIE_NAMES } from "@/lib/constants";
   ```

2. **Use constants instead of magic strings**:

   ```typescript
   // Bad
   if (response.status === 404) { ... }

   // Good
   if (response.status === HTTP_STATUS.NOT_FOUND) { ... }
   ```

3. **Destructure when using multiple constants**:

   ```typescript
   import { HTTP_STATUS, API_ERROR_CODES } from "@/lib/constants";
   ```

4. **Use TypeScript types for better type safety**:

   ```typescript
   const status: HttpStatusValue = HTTP_STATUS.OK;
   ```

5. **Document custom constants** with JSDoc comments.

## Backward Compatibility

All legacy constants are still available with `@deprecated` warnings to ensure smooth migration. Plan to remove legacy exports in the next major version.
