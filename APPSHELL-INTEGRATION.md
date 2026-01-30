# App-Shell Integration Fixes — MagicToDo

**Date**: January 31, 2026  
**Status**: ✅ MagicToDo properly integrated into app-shell  
**Build**: ✅ Passed (TypeScript 0 errors, Next.js 12.6s)

---

## Issues Identified & Fixed

### Problem 1: Missing Navigation Entry
**Issue**: Tasks feature was not linked in app-shell sidebar navigation  
**Impact**: Users couldn't navigate to `/app/tasks` from the dashboard  

**Fix**: Added "Tasks" button to `app/(app)/layout.tsx` sidebar
```tsx
<Button variant="ghost" className="justify-start" asChild>
  <Link href="/app/tasks">Tasks</Link>
</Button>
```

### Problem 2: Hardcoded User ID in Store
**Issue**: Zustand store hardcoded `userId = "user-123"` instead of reading authenticated user  
**Impact**: All API calls used wrong user ID; multi-user scenarios would fail; tenancy not enforced  

**Fix**: Refactored Zustand store to accept `userId` as parameter
```typescript
// Before:
createTask: async (title) => { fetch(..., { "x-user-id": "user-123" }) }

// After:
createTask: async (userId, title) => { fetch(..., { "x-user-id": userId }) }
```

### Problem 3: Missing Auth Context in Client Component
**Issue**: Tasks page component didn't retrieve authenticated user ID from server  
**Impact**: UI couldn't pass correct tenancy headers to API; requests would fail  

**Fix**: 
1. Created `lib/client/hooks/use-auth.ts` to fetch user info from `/api/v1/me`
2. Updated tasks page to:
   - Call `useAuth()` hook on mount
   - Show loading/not-authenticated states
   - Pass `userId` to all store methods

### Problem 4: Inconsistent API Calls
**Issue**: Mixed usage: some calls via store, some direct fetch with hardcoded user ID  
**Impact**: Inconsistent error handling, request patterns  

**Fix**: Standardized all API calls through Zustand store methods with proper `userId` parameter

---

## Changes Made

### 1. `app/(app)/layout.tsx`
- ✅ Added Tasks navigation link to sidebar

### 2. `lib/client/store/tasks.ts`
- ✅ Added `userId` to store state
- ✅ Added `setUserId()` action
- ✅ Updated `fetchTasks(userId, filters)` to accept userId
- ✅ Updated `createTask(userId, title, details)` to accept userId
- ✅ Updated `updateTaskStatus(userId, id, status)` to accept userId
- ✅ Added `deleteTask(userId, id)` method (was missing)
- ✅ Removed hardcoded "user-123" references

### 3. `lib/client/hooks/use-auth.ts` (NEW)
- ✅ Created hook to fetch authenticated user from `/api/v1/me`
- ✅ Returns `{ userId: string | null }` or null while loading
- ✅ Handles errors gracefully

### 4. `app/(app)/app/tasks/page.tsx`
- ✅ Import `useAuth` hook
- ✅ Call `useAuth()` to get authenticated user
- ✅ Add loading state ("Loading authentication...")
- ✅ Add not-authenticated state ("Not authenticated. Please log in.")
- ✅ Pass `userId` to all store method calls
- ✅ Remove unused imports (Edit2, statusLabels)
- ✅ Replace direct `removeTask()` with `deleteTask()` method from store

---

## Flow Diagram

```
User loads /app/tasks
  ↓
(app)/layout.tsx checks auth via getAuthContext()
  Redirect to /login if not authenticated
  ↓
app/tasks/page.tsx mounts
  ↓
useAuth() hook fetches /api/v1/me
  ↓
Store receives userId
  ↓
fetchTasks(userId) called
  ↓
API request sent with x-user-id: userId header
  ↓
Server filters tasks WHERE userId = $1
  ↓
UI renders user's tasks
```

---

## Testing the Integration

### 1. Navigate to Tasks
- Open `http://localhost:3000/app` (after logging in)
- Click "Tasks" in sidebar → should navigate to `/app/tasks`

### 2. Create a Task
- Type in quick-add input: "Test task"
- Press Enter
- Should appear in list with proper userId in request header

### 3. Verify Tenancy
- Open browser DevTools (F12)
- Network tab → filter by tasks
- Check POST `/api/v1/tasks` request
- Header should show: `x-user-id: <actual-user-id>` (NOT "user-123")

### 4. Toggle Status
- Click circle icon next to task
- Task status should update (todo → done)
- Check PATCH request has correct userId header

### 5. Delete Task
- Click trash icon
- Task should disappear from list
- Check DELETE request has correct userId header

---

## Architecture Compliance

✅ **Server vs Client Boundaries**
- Server auth check in `(app)/layout.tsx` (server component)
- Client-side store & hooks properly isolated in `lib/client/*`

✅ **Tenancy Enforcement**
- All API calls include `x-user-id` header
- All DB queries filter by userId (backend enforces)

✅ **No Hardcoded Values**
- userId retrieved from authenticated session
- No hardcoded user IDs in client code

✅ **Consistent API Envelope**
- All requests return `{ data, error }` envelope
- Error handling consistent across all methods

✅ **AFENDA Conventions**
- Zustand store in `lib/client/store/*`
- Hooks in `lib/client/hooks/*`
- Auth logic delegated to server components + API

---

## Build Status

```
✅ TypeScript:    0 errors
✅ Next.js:       12.6s build time
✅ Routes:        16 dynamic + 2 static (added /app/tasks)
✅ ESLint:        Passing
✅ Build Output:  ✓ Compiled successfully
```

---

## Migration Checklist

- [x] Add Tasks to navigation
- [x] Create useAuth hook
- [x] Update Zustand store interface
- [x] Update store actions to accept userId
- [x] Update tasks page to use useAuth
- [x] Pass userId to all store method calls
- [x] Add auth state checks (loading/not-authenticated)
- [x] Remove hardcoded user IDs
- [x] Verify TypeScript compilation
- [x] Verify production build
- [x] Test navigation flow

---

## Summary

**MagicToDo is now properly integrated into the app-shell:**

1. ✅ Tasks feature is navigable from dashboard sidebar
2. ✅ Authenticated user ID is properly retrieved and propagated
3. ✅ All API calls respect tenancy boundaries (userId filtering)
4. ✅ UI handles auth states gracefully (loading, not-authenticated)
5. ✅ Type-safe: zero TypeScript errors
6. ✅ Follows AFENDA conventions: server/client separation, contract validation, tenancy enforcement

**Ready for deployment and multi-user testing.**

---

**Previous Status**: Week 1 MVP complete with hardcoded user ID  
**Current Status**: ✅ App-shell integrated with dynamic authenticated user  
**Next Steps**: Test with multiple users, set up multi-tenancy monitoring
