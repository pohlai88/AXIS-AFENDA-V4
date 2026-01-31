# `lib/client/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Client-only helpers (state, hydration, browser APIs) with performance optimizations.

## Rule

Anything that touches `window`, `document`, `localStorage`, etc. should live here (or in a Client Component).

## Contents

### `hooks/` - Client-Side Hooks

React hooks optimized for client-side operations.

#### `use-auth.ts`

Authentication state management with optimized API calls.

```typescript
import { useAuth } from '@/lib/client/hooks/use-auth'

export default function UserProfile() {
  const { user, loading, error } = useAuth()

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!user) return <div>Please log in</div>

  return <div>Welcome, {user.name}!</div>
}
```

#### `use-local-storage.ts`

Optimized localStorage with debounced sync.

```typescript
import { useLocalStorage } from "@/lib/client/hooks/use-local-storage";

// Debounced localStorage (300ms delay)
const [settings, setSettings] = useLocalStorage(
  "app-settings",
  defaultSettings,
);

// Custom debounce delay
const [data, setData] = useLocalStorage("large-data", {}, { debounce: 1000 });
```

### `state/` - State Management

Client-side state management solutions.

#### `store/` - Zustand Stores

Optimized stores with performance patterns.

```typescript
import { useUserStore } from "@/lib/client/store/user";

// Optimized store with selectors
const userName = useUserStore((state) => state.name);
const updateUser = useUserStore((state) => state.updateUser);

// Batch updates for better performance
const batchUpdate = useUserStore.getState().batchUpdate;
batchUpdate({ name: "John", email: "john@example.com" });
```

### Performance Optimizations

#### Debounced Operations

```typescript
// Debounced API calls to prevent spam
const debouncedSave = useDebouncedCallback((data) => {
  apiFetch("/api/save", { method: "POST", body: JSON.stringify(data) });
}, 500);
```

#### Optimistic Updates

```typescript
// Optimistic updates with rollback
const updateTask = async (taskId: string, updates: Partial<Task>) => {
  // Optimistic update
  const previousState = useTaskStore.getState().tasks;
  useTaskStore.getState().updateTaskOptimistic(taskId, updates);

  try {
    await apiFetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  } catch (error) {
    // Rollback on error
    useTaskStore.getState().setTasks(previousState);
    throw error;
  }
};
```

#### Cached Data Fetching

```typescript
// Cached with SWR
import useSWR from "swr";
import { apiFetch } from "@/lib/api/client";

const { data, error, mutate } = useSWR(
  "/api/users",
  () => apiFetch("/api/users", UserListSchema),
  {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  },
);
```

## Best Practices

### Client-Side State

1. **Local State**: Use React state for component-local state
2. **Shared State**: Use Zustand stores for cross-component state
3. **Server State**: Use SWR or React Query with the optimized API client
4. **Form State**: Use React Hook Form with Zod validation

### Performance Patterns

1. **Debounce User Input**:

   ```typescript
   const debouncedSearch = useDebouncedCallback(search, 300);
   ```

2. **Memoize Expensive Computations**:

   ```typescript
   const filteredData = useMemo(
     () => data.filter((item) => item.active),
     [data],
   );
   ```

3. **Lazy Load Components**:

   ```typescript
   const HeavyComponent = lazy(() => import("./HeavyComponent"));
   ```

4. **Use Selectors in Stores**:

   ```typescript
   // Bad: Re-renders on any change
   const user = useUserStore();

   // Good: Only re-renders when name changes
   const name = useUserStore((state) => state.name);
   ```

### Error Handling

Use error boundaries and proper error states:

```typescript
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <pre>{error.message}</pre>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

## Hydration

### SSR/Hydration Patterns

```typescript
// Use useEffect for client-only code
useEffect(() => {
  // This only runs on client
  window.addEventListener("resize", handleResize);
  return () => window.removeEventListener("resize", handleResize);
}, []);

// Or use custom hook
const { isClient } = useIsClient();
if (!isClient) return null; // Server-side fallback
```

## Browser APIs

### Safe Browser API Usage

```typescript
// Safe localStorage access
import { safeLocalStorage } from "@/lib/client/storage";

const value = safeLocalStorage.getItem("key");
safeLocalStorage.setItem("key", value);

// Safe window access
import { getWindow } from "@/lib/client/window";

const win = getWindow();
if (win) {
  win.open("/new-page", "_blank");
}
```

## Testing

### Client-Side Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { UserProvider } from '@/lib/client/context/user'

test('displays user name', async () => {
  render(
    <UserProvider>
      <UserProfile />
    </UserProvider>
  )

  await waitFor(() => {
    expect(screen.getByText('Welcome, John!')).toBeInTheDocument()
  })
})
```

## Security Considerations

1. **No Secrets**: Never store secrets in client-side code
2. **Validate Input**: Always validate user input on the server
3. **Sanitize Data**: Sanitize data before rendering
4. **Use HTTPS**: Always use HTTPS in production
5. **CSP Headers**: Implement Content Security Policy
