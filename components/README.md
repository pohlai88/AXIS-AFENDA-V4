# `components/`

[← Back to root README](../README.md)

## What lives here

- Shared React UI components used across routes.
- `components/ui/` contains reusable UI primitives (shadcn-style).

## Performance Optimizations

Components have been optimized for better performance:

### Optimized UI Components

- **Debounced Inputs**: Search inputs use debounce to reduce API calls
- **Lazy Loading**: Heavy components use dynamic imports
- **Error Boundaries**: Proper error handling with fallback UI
- **Memoization**: Expensive computations are memoized

### Example Optimized Component

```typescript
'use client'
import { useDebounce } from '@/lib/utils'
import { apiFetch } from '@/lib/api/client'

export default function SearchInput() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  // Debounce search to reduce API calls
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      // Use cached API client
      apiFetch(`/api/search?q=${debouncedQuery}`, SearchResultsSchema)
        .then(setResults)
    }
  }, [debouncedQuery])

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <SearchResults results={results} />
    </div>
  )
}
```

## Component Guidelines

### Server vs Client Components

1. **Server Components (Default)**:
   - Use for static content and data fetching
   - Better performance (no client-side JavaScript)
   - Direct database access allowed
   - No state or effects

2. **Client Components**:
   - Add `"use client"` directive
   - Use for interactivity, state, or browser APIs
   - Import optimized utilities from `lib/utils`
   - Use debouncing for user inputs

### Performance Best Practices

1. **Debounce User Input**:

   ```typescript
   import { useDebounce } from "@/lib/utils";

   const debouncedValue = useDebounce(value, 300);
   ```

2. **Memoize Expensive Operations**:

   ```typescript
   const memoizedValue = useMemo(() => {
     return expensiveCalculation(data);
   }, [data]);
   ```

3. **Lazy Load Heavy Components**:

   ```typescript
   const HeavyChart = dynamic(() => import('./HeavyChart'), {
     loading: () => <div>Loading chart...</div>
   })
   ```

4. **Use Error Boundaries**:
   ```typescript
   <ErrorBoundary fallback={<div>Something went wrong</div>}>
     <RiskyComponent />
   </ErrorBoundary>
   ```

## UI Components (`components/ui/`)

### shadcn/ui Integration

- Built with shadcn/ui components
- Consistent design system
- Fully typed with TypeScript
- Accessible by default

### Common UI Components

#### Forms

```typescript
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'

export function UserForm() {
  return (
    <Form>
      <FormField name="email">
        <FormItem>
          <FormControl>
            <Input type="email" placeholder="Email" />
          </FormControl>
        </FormItem>
      </FormField>
      <Button type="submit">Submit</Button>
    </Form>
  )
}
```

#### Data Display

```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export function UserTable({ users }: { users: User[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.name}</TableCell>
            <TableCell>
              <Badge variant={user.active ? 'default' : 'secondary'}>
                {user.active ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

## State Management

### Local State

Use React state for component-local state:

```typescript
const [isOpen, setIsOpen] = useState(false);
```

### Server State

Use the optimized API client for server state:

```typescript
import { apiFetch } from "@/lib/api/client";

const { data, error } = useSWR("/api/users", () =>
  apiFetch("/api/users", UserListSchema),
);
```

### Global State

Use stores from `lib/client/store/` for complex state:

```typescript
import { useUserStore } from "@/lib/client/store/user";

const { user, updateUser } = useUserStore();
```

## Styling

### Tailwind CSS

- Use utility classes for styling
- Prefer semantic tokens from design system
- Responsive design with mobile-first approach

### CSS-in-JS (when needed)

```typescript
import { css } from "@/lib/shared/design-system/css";

const styles = css({
  display: "flex",
  gap: "$4",
  padding: "$4",
});
```

## Testing

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

test('renders button', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

## Client/Server Guidance

- Prefer Server Components by default (especially for layout/static UI).
- Add `"use client"` only to components that need browser APIs, state, or effects.
- Use optimized utilities from `lib/utils` for performance.
- Implement proper error handling and loading states.
