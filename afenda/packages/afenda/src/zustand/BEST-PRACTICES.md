# Zustand Best Practices Guide

## Store Creation Patterns

### Basic Store
```typescript
import { createStore } from "./_zustand.create";

type CounterState = {
  count: number;
  increment: () => void;
  decrement: () => void;
};

export const useCounterStore = createStore<CounterState>({
  name: "counter",
  initial: { count: 0 },
  build: (set, get) => ({
    increment: () => set({ count: get().count + 1 }),
    decrement: () => set({ count: get().count - 1 }),
  }),
});
```

### Persisted Store
```typescript
import { createStore } from "./_zustand.create";
import { makePersistOptions } from "./_zustand.persist";

export const useThemeStore = createStore({
  name: "theme",
  initial: { theme: "light", fontSize: 16 },
  persistOptions: makePersistOptions({
    name: "theme",
    version: "1.0.0",
    partialize: (s) => ({ theme: s.theme, fontSize: s.fontSize }),
  }),
  build: (set) => ({
    setTheme: (theme) => set({ theme }),
    setFontSize: (fontSize) => set({ fontSize }),
  }),
});
```

### Slice-Based Store
```typescript
import { createStore } from "./_zustand.create";
import { createPaginationSlice, createLoadingSlice, mergeSlices } from "./_zustand.slices";

export const useDataStore = createStore({
  name: "data",
  initial: {},
  build: mergeSlices(
    createPaginationSlice({ page: 1, pageSize: 20 }),
    createLoadingSlice()
  ),
});
```

## Performance Optimization

### Use Selectors with Shallow Comparison
```typescript
// ❌ Bad: Re-renders on any state change
const state = useStore();

// ✅ Good: Re-renders only when specific values change
const { name, email } = useStore(
  (s) => ({ name: s.name, email: s.email }),
  shallow
);

// ✅ Better: Use pre-built selectors
const { name, email } = useStore(selectors.userInfo, shallow);
```

### Subscribe to Specific Changes
```typescript
import { subscribeWithSelector } from "zustand/middleware";

// Subscribe to specific state changes
useStore.subscribe(
  (state) => state.count,
  (count, prevCount) => {
    console.log("Count changed:", prevCount, "→", count);
  }
);
```

## State Organization

### Separate State and Actions
```typescript
// State type
type TodoState = {
  todos: Todo[];
  filter: Filter;
};

// Actions type
type TodoActions = {
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  setFilter: (filter: Filter) => void;
};

// Combined
type TodoStore = TodoState & TodoActions;
```

### Use Action Utilities
```typescript
import { toggle, addString, removeString, updateById } from "./_zustand.actions";

export const useStore = createStore({
  build: (set, get) => ({
    toggleSidebar: () => set({ open: toggle(get().open) }),
    addTag: (tag) => set({ tags: addString(get().tags, tag) }),
    removeTag: (tag) => set({ tags: removeString(get().tags, tag) }),
    updateItem: (id, data) => set({ items: updateById(get().items, id, data) }),
  }),
});
```

## Testing

### Mock Store
```typescript
import { createMockStore } from "./_zustand.testing";

it("updates count", () => {
  const store = createMockStore({ count: 0, increment: vi.fn() });
  store.getState().increment();
  expect(store.getState().count).toBe(1);
});
```

### Spy on Actions
```typescript
import { spyOnStoreAction } from "./_zustand.testing";

it("calls increment", () => {
  const spy = spyOnStoreAction(useStore, "increment");
  useStore.getState().increment();
  expect(spy.calls).toHaveLength(1);
  spy.restore();
});
```

## Common Patterns

### Modal State
```typescript
import { createModalSlice } from "./_zustand.slices";

type ModalData = { id: string; name: string };

export const useModalStore = createStore({
  name: "modal",
  initial: {},
  build: createModalSlice<any, ModalData>(),
});

// Usage
const { openModal, closeModal, isOpen, modalData } = useModalStore();
```

### Async Actions
```typescript
export const useDataStore = createStore({
  build: (set) => ({
    fetchData: async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.fetch();
        set({ data, isLoading: false });
      } catch (error) {
        set({ error, isLoading: false });
      }
    },
  }),
});
```

### Computed Values
```typescript
// Use selectors for computed values
export const selectors = {
  total: (s) => s.items.reduce((sum, item) => sum + item.price, 0),
  hasItems: (s) => s.items.length > 0,
  filteredItems: (s) => s.items.filter((item) => item.status === s.filter),
};
```

## Migration Guide

### Adding New Fields
```typescript
import { createMergeStateMigration } from "./_zustand.persist";

const defaults = { version: "2.0.0", theme: "light", newField: "value" };

export const useStore = createStore({
  persistOptions: makePersistOptions({
    name: "theme",
    version: "2.0.0",
    migrate: createMergeStateMigration(defaults),
  }),
});
```

### Breaking Changes
```typescript
export const useStore = createStore({
  persistOptions: {
    name: "theme:v2.0.0", // New version key
    migrate: (persistedState, version) => {
      if (version < 2) {
        // Transform old state to new structure
        return transformOldToNew(persistedState);
      }
      return persistedState;
    },
  },
});
```

## Anti-Patterns to Avoid

### ❌ Don't Store Server Data
```typescript
// Bad: Storing API responses
const useStore = createStore({
  initial: { users: [], posts: [] },
  build: (set) => ({
    setUsers: (users) => set({ users }),
  }),
});

// Good: Use React Query or SWR for server state
```

### ❌ Don't Create Multiple Stores for Same Domain
```typescript
// Bad: Split related state
const useUserStore = createStore(...);
const useUserSettingsStore = createStore(...);

// Good: Single store with slices
const useUserStore = createStore({
  build: mergeSlices(profileSlice, settingsSlice),
});
```

### ❌ Don't Mutate State Directly
```typescript
// Bad: Direct mutation
set((state) => {
  state.items.push(newItem); // Mutates original
  return state;
});

// Good: Immutable update
set((state) => ({
  items: [...state.items, newItem],
}));
```

## Debugging

### Use Devtools
```typescript
export const useStore = createStore({
  name: "myStore", // Shows in Redux DevTools
  enableDevtools: true,
  enableTrace: true, // Enable stack traces
});
```

### Log State Changes
```typescript
import { logger } from "./_zustand.middleware";

export const useStore = create(logger((set) => ({
  count: 0,
  increment: () => set({ count: get().count + 1 }),
})));
```
