# `lib/contracts/`

[← Back to `lib/`](../README.md) · [↑ Root README](../../README.md)

## Purpose

Shared schemas/types that define contracts between server and client with type safety and validation.

- `api-error.ts`: error payload schema used in API envelopes.
- `approvals.ts`: request validation schemas for the approvals vertical slice.
- `_type-tests.ts`: compile-time type tests (drift prevention; not imported at runtime).

## Recent Enhancements

### Type Safety Improvements

- All contracts use Zod schemas for runtime validation
- TypeScript types generated from schemas
- Comprehensive error handling patterns
- Performance-optimized validation

### Contract Structure

#### API Envelope Schema

```typescript
import { ApiEnvelopeSchema } from "@/lib contracts/api-envelope";

// Standard API response envelope
const response = {
  data: {
    /* actual data */
  },
  error: null,
  requestId: "uuid-123",
};

// Validate with schema
const validated = ApiEnvelopeSchema(UserSchema).parse(response);
```

#### Error Contract

```typescript
import { ApiErrorSchema } from "@/lib/contracts/api-error";

// Standardized error format
const error = {
  code: "VALIDATION_ERROR",
  message: "Invalid input",
  details: { field: "email", issue: "required" },
  requestId: "uuid-123",
};
```

## Usage Patterns

### Defining Contracts

```typescript
// user.ts
import { z } from "zod";

// Base schema
export const UserBaseSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.datetime(),
  updatedAt: z.datetime(),
});

// Create schema (for POST)
export const CreateUserSchema = UserBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8),
});

// Update schema (for PATCH)
export const UpdateUserSchema = UserBaseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial();

// Response schema
export const UserResponseSchema = UserBaseSchema.omit({
  password: true,
});

// Generate TypeScript types
export type User = z.infer<typeof UserResponseSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
```

### Using Contracts in API Routes

**Route handlers must:**
1. Import schemas from contracts (never define inline)
2. Validate request bodies with `parseJson(req, schema)`
3. Validate query params with `parseSearchParams(searchParams, schema)`
4. **Validate route params** with param schemas

#### Request Body Validation

```typescript
// app/api/v1/tasks/route.ts
import { parseJson } from "@/lib/server/api/validate";
import { CreateTaskSchema } from "@/lib/contracts/tasks";

export async function POST(request: Request) {
  const body = await parseJson(request, CreateTaskSchema);
  // body is now typed and validated
}
```

#### Route Parameter Validation (Dynamic Routes)

**All dynamic routes must validate params using dedicated param schemas:**

```typescript
// app/api/v1/tasks/[id]/route.ts
import { taskParamsSchema } from "@/lib/contracts/tasks";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // ✅ CORRECT: Validate params
  const rawParams = await params;
  const { id } = taskParamsSchema.parse(rawParams);
  
  // ❌ WRONG: Direct destructuring (no validation)
  // const { id } = await params;
}
```

**Param schema pattern:**
```typescript
// lib/contracts/tasks.ts
export const taskParamsSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
})

export type TaskParams = z.infer<typeof taskParamsSchema>
```

See [Dynamic Routes Guide](../../docs/api-dynamic-routes-guide.md) for complete details.

#### Query Parameter Validation

```typescript
// app/api/users/route.ts
import { validateRequest } from "@/lib/server/api/validate";
import { CreateUserSchema } from "@/lib/contracts/user";
import { success, error } from "@/lib/server/api/response";

export async function POST(request: Request) {
  // Validate request body
  const { data, error: validationError } = await validateRequest(
    request,
    CreateUserSchema,
  );

  if (validationError) {
    return validationError;
  }

  // Process validated data
  const user = await createUser(data);

  return success(user, 201);
}
```

### Using Contracts in Client

```typescript
// components/user-form.tsx
import { apiFetch } from "@/lib/api/client";
import { CreateUserSchema, type CreateUser } from "@/lib/contracts/user";

export default function UserForm() {
  const handleSubmit = async (formData: CreateUser) => {
    try {
      // Type-safe API call with schema validation
      const user = await apiFetch(
        "/api/users",
        {
          method: "POST",
          body: JSON.stringify(formData),
        },
        UserResponseSchema,
      );

      console.log("Created user:", user);
    } catch (error) {
      if (error instanceof ApiFetchError) {
        console.error("API Error:", error.code, error.details);
      }
    }
  };

  // Form implementation...
}
```

## Performance Optimizations

### Schema Validation

- Zod schemas are optimized for performance
- Selective validation for different use cases
- Cached validation for repeated checks

```typescript
// Efficient partial validation
const partialUser = UpdateUserSchema.parse(partialData);

// Pre-compiled schemas for better performance
const CompiledUserSchema = UserSchema.compile();
const validated = CompiledUserSchema.parse(data);
```

### Type Generation

- Types generated once at build time
- No runtime overhead for type checking
- IntelliSense support in IDE

## Best Practices

### Schema Design

1. **Be Specific**: Define exact shapes and constraints
2. **Reuse Schemas**: Extend and modify base schemas
3. **Document Fields**: Use Zod's describe() for documentation
4. **Validate Early**: Validate at API boundaries

```typescript
// Good: Specific constraints
export const EmailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .describe("User email address");

// Good: Reuse base schemas
export const AdminUserSchema = UserSchema.extend({
  role: z.literal("admin"),
  permissions: z.array(z.string()),
});
```

### Error Handling

1. **Use Standard Errors**: Follow ApiErrorSchema
2. **Provide Context**: Include field-level errors
3. **Add Request IDs**: For debugging and tracing

```typescript
// Good error response
{
  code: 'VALIDATION_ERROR',
  message: 'Validation failed',
  details: {
    fields: [
      { name: 'email', message: 'Invalid email' },
      { name: 'password', message: 'Too short' }
    ]
  },
  requestId: 'req-123'
}
```

### Versioning

1. **Version Contracts**: Include version in schema
2. **Backward Compatibility**: Support old versions
3. **Migration Paths**: Plan for schema changes

```typescript
// Versioned schema
export const UserV1Schema = z.object({
  id: z.string(),
  name: z.string(),
  // v1 fields
});

export const UserV2Schema = UserV1Schema.extend({
  email: z.string().email(),
  // v2 fields
});

// Select schema based on version
const getUserSchema = (version: "v1" | "v2") =>
  version === "v1" ? UserV1Schema : UserV2Schema;
```

## Testing

### Schema Testing

```typescript
import { expect } from "vitest";
import { UserSchema } from "@/lib/contracts/user";

test("validates user correctly", () => {
  const validUser = {
    id: "123",
    name: "John",
    email: "john@example.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  expect(UserSchema.parse(validUser)).toEqual(validUser);
});

test("rejects invalid email", () => {
  const invalidUser = {
    id: "123",
    name: "John",
    email: "invalid-email",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  expect(() => UserSchema.parse(invalidUser)).toThrow();
});
```

### Type Tests

```typescript
// _type-tests.ts
import { expectTypeOf } from "vitest";
import { User, CreateUser } from "@/lib/contracts/user";

// Compile-time type tests
expectTypeOf<CreateUser>().not.toHaveProperty("id");
expectTypeOf<User>().toHaveProperty("id");
```

## Available Contracts

- `api-envelope.ts` - Standard API response format
- `api-error.ts` - Error response schema
- `approvals.ts` - Approvals feature contracts
- `user.ts` - User management contracts
- `task.ts` - Task management contracts
- `common.ts` - Shared utility schemas
