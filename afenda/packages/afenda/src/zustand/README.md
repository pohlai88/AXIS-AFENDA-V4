# Afenda Zustand (UI State Management)

## OBJECTIVE
- Zustand is the UI state layer for client-side state truth.
- If state needs persistence or reactivity, it lives here.

## COVERS
1) **UI state only** (filters, view modes, selection, client-side cache).
2) **Type-safe stores** (full TypeScript inference).
3) **Middleware utilities** (persist, devtools, subscribeWithSelector).
4) **Selector patterns** for performance optimization.
5) **Action utilities** for consistent state mutations.

## RULES
- File naming is stage-based (this folder is the `zustand` stage). Keep internal helpers prefixed with `_zustand.`.
- No DB schema. No Drizzle. No server-only imports.
- Client-side only (`"use client"` directive where needed).
- No side effects on module import.

## ALLOWED
- Store creation with `createStore(...)`.
- Selectors with shallow comparison.
- Actions/reducers for state mutations.
- Persist middleware for stable preferences.
- Slices for large store composition.

## FORBIDDEN 🚫
- Server-side data fetching.
- Database schema definitions.
- API handlers or route logic.
- Business domain logic (belongs in service layer).
- Global side effects (timers, subscriptions outside store).
