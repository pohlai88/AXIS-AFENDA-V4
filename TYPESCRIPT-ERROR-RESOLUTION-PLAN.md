# TypeScript Error Resolution Plan

## Error Distribution Analysis

Based on `pnpm typecheck` output, we have **117 errors across 11 files**:

| File | Errors | Strategy |
|------|--------|----------|
| `lib/client/offline/conflict-resolver.ts` | 37 | **REWRITE** |
| `app/api/v1/sync/push/route.ts` | 27 | **REWRITE** |
| `lib/client/offline/offline-manager.ts` | 16 | Incremental Fix |
| `app/api/v1/sync/resolve/route.ts` | 9 | Incremental Fix |
| `app/api/v1/sync/pull/route.ts` | 8 | Incremental Fix |
| `components/offline-status-indicator.tsx` | 5 | Incremental Fix |
| `lib/client/offline/sync-queue.ts` | 4 | Incremental Fix |
| `lib/client/offline/tasks-store-wrapper.ts` | 4 | Incremental Fix |
| `lib/client/offline/storage.ts` | 3 | Incremental Fix |
| `components/conflict-resolution-modal.tsx` | 2 | Incremental Fix |
| `lib/server/search/index.ts` | 2 | Incremental Fix |

## Resolution Strategy

### Phase 1: Rewrite High-Error Files (>20 errors)

#### 1.1 `lib/client/offline/conflict-resolver.ts` (37 errors)
**Root Cause**: Type mismatches between OfflineTask/OfflineProject and Task/Project types
**Solution**: 
- Use proper type guards for discriminating unions
- Fix method signatures to accept correct types
- Ensure resolved data types match expected schemas

#### 1.2 `app/api/v1/sync/push/route.ts` (27 errors)
**Root Cause**: Complex transaction types and data type mismatches
**Solution**:
- Simplify transaction type annotations
- Use proper type assertions for database operations
- Fix data type handling in processOperation functions

### Phase 2: Incremental Fixes (5-16 errors)

#### 2.1 `lib/client/offline/offline-manager.ts` (16 errors)
- Fix type mismatches in processServerTasks/Projects
- Correct applyAutoResolution parameter types
- Fix createTaskOffline parameter types

#### 2.2 `app/api/v1/sync/resolve/route.ts` (9 errors)
- Fix conflict resolution data types
- Correct strategy type handling

#### 2.3 `app/api/v1/sync/pull/route.ts` (8 errors)
- Fix sync response data types
- Correct deleted items handling

#### 2.4 `components/offline-status-indicator.tsx` (5 errors)
- Fix offline state type handling

### Phase 3: Quick Fixes (<5 errors)

#### 3.1 `lib/client/offline/sync-queue.ts` (4 errors) - DONE
- ✅ Fixed data property access with type guards

#### 3.2 `lib/client/offline/tasks-store-wrapper.ts` (4 errors) - DONE
- ✅ Removed userId from offline task creation
- ✅ Fixed TaskUpdateInput → TaskUpdate
- ✅ Fixed syncStatus return type

#### 3.3 `lib/client/offline/storage.ts` (3 errors)
- Fix storage method signatures

#### 3.4 `components/conflict-resolution-modal.tsx` (2 errors)
- Fix conflict data type handling

#### 3.5 `lib/server/search/index.ts` (2 errors)
- Fix search result type mapping

## Key Type Issues to Address

### 1. Sync Field Mismatches
- API contracts exclude sync fields (syncStatus, syncVersion, etc.)
- Offline types include sync fields
- Need proper type transformations between layers

### 2. Union Type Handling
- `TaskCreate | TaskUpdate | ProjectCreate | ProjectUpdate | Record<string, unknown>`
- Need type guards to safely access properties

### 3. Database Transaction Types
- Drizzle transaction types are verbose
- Consider using type aliases for readability

### 4. Optional vs Required Fields
- Some fields are optional in API but required in storage
- Need proper type conversions

## Implementation Order

1. ✅ **Phase 3 Quick Fixes** - Get easy wins first
2. **Phase 1 Rewrites** - Tackle high-error files with clean slate
3. **Phase 2 Incremental** - Fix remaining files methodically
4. **Verification** - Run typecheck and lint to confirm all resolved

## Success Criteria

- [ ] Zero TypeScript errors (`pnpm typecheck` passes)
- [ ] Zero lint errors (`pnpm lint` passes)
- [ ] All offline sync functionality properly typed
- [ ] No `any` types remain in codebase
- [ ] Type safety maintained across all layers

## Notes

- Maintain separation between API contracts and database types
- Use type guards for discriminating unions
- Prefer explicit types over inference where clarity is needed
- Document complex type transformations with comments
