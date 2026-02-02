# Dynamic Routes Configuration Guide

## Overview

This document outlines the standard pattern for implementing dynamic API routes in the NEXIS-AFENDA-V4 project, ensuring type safety, validation, and consistency across all dynamic endpoints.

## Pattern Summary

All dynamic routes (routes with `[param]` segments) must:
1. ✅ Define param validation schemas in `lib/contracts/`
2. ✅ Validate params at the start of each handler
3. ✅ Use TypeScript types generated from schemas
4. ✅ Follow the standard error handling pattern

## Implementation Steps

### Step 1: Define Param Schema in Contracts

Location: `lib/contracts/<domain>.ts`

```typescript
// lib/contracts/tasks.ts
import { z } from "zod"

// Param validation schema
export const taskParamsSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
})

// Type export
export type TaskParams = z.infer<typeof taskParamsSchema>
```

**Schema Guidelines:**
- Use descriptive validation (e.g., `.uuid()` for UUIDs)
- Provide clear error messages
- Keep params separate from request body schemas
- Export both schema and type

### Step 2: Implement Route Handler with Validation

Location: `app/api/v1/<domain>/[id]/route.ts`

```typescript
/**
 * @domain magictodo
 * @layer api
 * @responsibility API route handler for /api/v1/tasks/:id
 */

import "@/lib/server/only"
import { headers } from "next/headers"
import { HEADER_NAMES } from "@/lib/constants/headers"
import { 
  updateTaskRequestSchema, 
  taskParamsSchema 
} from "@/lib/contracts/tasks"
import { 
  HttpError, 
  Unauthorized, 
  NotFound, 
  BadRequest 
} from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTask, updateTask, deleteTask } from "@/lib/server/db/queries/tasks"

// Route segment config
export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/tasks/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    // ✅ Validate params
    const rawParams = await params
    const { id } = taskParamsSchema.parse(rawParams)
    
    // Auth validation
    const auth = await getAuthContext()
    if (!auth.userId) throw Unauthorized()
    
    // Business logic
    const task = await getTask(auth.userId, id)
    if (!task) throw NotFound("Task not found")
    
    return ok(task)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
```

## Pattern Variations

### Using withApiErrorBoundary

```typescript
export async function GET(
  req: Request, 
  context: { params: Promise<{ id: string }> }
) {
  return withApiErrorBoundary(req, async (log, requestId) => {
    const rawParams = await context.params
    const { id } = taskParamsSchema.parse(rawParams)
    
    const auth = await getAuthContext()
    if (!auth.userId) throw Unauthorized()
    
    const task = await getTask(auth.userId, id)
    if (!task) throw NotFound("Task not found")
    
    return ok(task)
  })
}
```

### Edge Runtime

```typescript
export const runtime = 'edge'

export async function GET(
  _req: Request, 
  ctx: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  
  try {
    const rawParams = await ctx.params
    const { id } = userIdParamSchema.parse(rawParams)
    
    const user = await getUserById(id)
    if (!user) throw NotFound("User not found")
    
    return ok(user)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
```

## Contract Organization

### Standard Param Schemas by Domain

| Domain | Contract File | Param Schemas |
|--------|--------------|---------------|
| Tasks | `lib/contracts/tasks.ts` | `taskParamsSchema`, `projectParamsSchema` |
| Organizations | `lib/contracts/organizations.ts` | `organizationParamsSchema`, `teamParamsSchema`, `membershipParamsSchema` |
| Sessions | `lib/contracts/sessions.ts` | `sessionIdParamSchema`, `userIdParamSchema` |
| Approvals | `lib/contracts/approvals.ts` | `approvalParamsSchema` |

### Naming Conventions

- **Schema:** `<resource>ParamsSchema` (e.g., `taskParamsSchema`)
- **Type:** `<Resource>Params` (e.g., `TaskParams`)
- **File:** Place in same contract file as request/response schemas

## Error Handling

### Param Validation Errors

When a param fails validation (e.g., invalid UUID):

```typescript
// ✅ Zod will throw a ZodError
// ✅ Error boundary catches it
// ✅ Returns: { data: null, error: { code: "BAD_REQUEST", message: "..." } }
```

Example error response:
```json
{
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid task ID",
    "requestId": "uuid-123"
  }
}
```

### Common Validation Rules

```typescript
// UUID validation
z.string().uuid("Invalid task ID")

// String with constraints
z.string().min(1).max(100)

// Enum values
z.enum(["active", "inactive"])

// Optional params
z.string().uuid().optional()

// Multiple params
z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  teamId: z.string().uuid("Invalid team ID"),
})
```

## Anti-Patterns (Avoid)

### ❌ No Validation

```typescript
// DON'T: Direct destructuring without validation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params  // ❌ No validation
  // ...
}
```

### ❌ Inline Schemas

```typescript
// DON'T: Define schemas inline
export async function GET(req: Request, ctx: Context) {
  const schema = z.object({ id: z.string() })  // ❌ Should be in contracts
  // ...
}
```

### ❌ Manual Validation

```typescript
// DON'T: Manual UUID validation
export async function GET(req: Request, ctx: Context) {
  const { id } = await ctx.params
  if (!isUUID(id)) {  // ❌ Use Zod schema instead
    return fail({ code: "BAD_REQUEST", message: "Invalid ID" }, 400)
  }
}
```

## Migration Checklist

For existing dynamic routes:

- [ ] Create param schema in appropriate `lib/contracts/*.ts` file
- [ ] Export schema and type
- [ ] Import schema in route handler
- [ ] Add `const rawParams = await params` before destructuring
- [ ] Replace direct destructuring with `schema.parse(rawParams)`
- [ ] Add `BadRequest` to error imports if not present
- [ ] Test route with invalid param (should return 400)
- [ ] Test route with valid param (should work as before)

## Benefits

✅ **Type Safety**: TypeScript knows exact param structure
✅ **Runtime Validation**: Invalid params caught early
✅ **Consistent Errors**: Standard error format across all routes
✅ **Single Source of Truth**: Param validation defined once
✅ **Self-Documenting**: Schema serves as documentation
✅ **Maintainable**: Easy to update validation rules

## Quick Reference

```typescript
// 1. Define schema in contract
export const taskParamsSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
})

// 2. Use in route
const rawParams = await params
const { id } = taskParamsSchema.parse(rawParams)

// 3. Handle errors automatically
// ZodError → 400 Bad Request
// HttpError → Specific status code
// Other errors → 500 Internal Server Error
```

## Examples by Route Type

### Simple GET with ID

```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  
  try {
    const rawParams = await params
    const { id } = resourceParamsSchema.parse(rawParams)
    
    const resource = await getResource(id)
    if (!resource) throw NotFound("Resource not found")
    
    return ok(resource)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
```

### PATCH with ID and Body

```typescript
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  
  try {
    const rawParams = await params
    const { id } = resourceParamsSchema.parse(rawParams)
    
    const auth = await getAuthContext()
    if (!auth.userId) throw Unauthorized()
    
    const body = await parseJson(request, updateResourceSchema)
    const updated = await updateResource(id, body)
    
    if (!updated) throw NotFound("Resource not found")
    
    return ok(updated)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
```

### Multiple Params (Nested Routes)

```typescript
// /api/v1/organizations/[orgId]/teams/[teamId]
export const orgTeamParamsSchema = z.object({
  orgId: z.string().uuid("Invalid organization ID"),
  teamId: z.string().uuid("Invalid team ID"),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string; teamId: string }> }
) {
  const rawParams = await params
  const { orgId, teamId } = orgTeamParamsSchema.parse(rawParams)
  // ...
}
```

---

**Last Updated:** February 2, 2026  
**Applies To:** All dynamic API routes in `app/api/**`  
**Required:** Yes, for all new routes. Existing routes should be migrated.
