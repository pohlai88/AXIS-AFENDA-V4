# TypeScript Error Fix Strategy

## Current Status: 117 errors across 11 files

## Strategy Decision

### Files Requiring REWRITE (>20 errors):
1. **lib/client/offline/conflict-resolver.ts** - 37 errors
2. **app/api/v1/sync/push/route.ts** - 27 errors

### Files for Incremental Fix:
- lib/client/offline/offline-manager.ts (16 errors)
- app/api/v1/sync/resolve/route.ts (9 errors)
- app/api/v1/sync/pull/route.ts (8 errors)
- components/offline-status-indicator.tsx (5 errors)
- lib/client/offline/sync-queue.ts (4 errors) ✅ FIXED
- lib/client/offline/tasks-store-wrapper.ts (4 errors) ✅ FIXED
- lib/client/offline/storage.ts (3 errors)
- components/conflict-resolution-modal.tsx (2 errors)
- lib/server/search/index.ts (2 errors)

## Root Cause Analysis

### Primary Issues:
1. **Type Mismatch**: API contracts (Task, Project) vs Storage types (OfflineTask, OfflineProject)
   - API types exclude sync fields
   - Storage types include sync fields
   - Need proper transformations

2. **Union Type Handling**: Data can be TaskCreate | TaskUpdate | ProjectCreate | ProjectUpdate
   - Need type guards to safely access properties
   - Current code assumes properties exist

3. **Transaction Types**: Drizzle transaction types are verbose and complex
   - Need type aliases or simplified approach

## Execution Plan

### Step 1: Create Type Utilities (NEW FILE)
Create `lib/client/offline/type-guards.ts` with:
- Type guards for discriminating unions
- Helper functions for type conversions
- Utility types for common patterns

### Step 2: Rewrite conflict-resolver.ts
- Use new type guards
- Simplify method signatures
- Fix all type assertions

### Step 3: Rewrite sync/push/route.ts
- Simplify transaction handling
- Use proper type guards for data
- Fix processOperation functions

### Step 4: Fix Remaining Files
- Apply type guards where needed
- Fix method signatures
- Ensure type safety

### Step 5: Verification
- Run typecheck
- Run lint
- Confirm zero errors

## Implementation Notes

- Keep existing logic intact
- Only fix type issues
- Add comments for complex type transformations
- Maintain backward compatibility
