# Frontend Subdomain Configuration

## Overview

This application implements **frontend-configurable subdomains** following the Vercel platforms.git pattern. Users can dynamically create and manage subdomains through the admin interface instead of hardcoding them.

## Architecture

### Database Schema

```sql
subdomain_config table:
├── id (UUID) - Primary key
├── subdomain (VARCHAR 63, unique) - e.g., "tenant1"
├── organization_id (UUID) - Organization owning this subdomain
├── team_id (UUID, nullable) - Optional team assignment
├── is_active (BOOLEAN) - Enable/disable subdomain
├── is_primary (BOOLEAN) - Mark as primary subdomain for org
├── created_by (UUID) - User who created this config
├── customization (JSONB) - Branding, colors, logo, etc.
├── created_at (TIMESTAMP) - Creation timestamp
└── updated_at (TIMESTAMP) - Last modification timestamp
```

**Indexes:**
- `organization_id` - Fast lookup by org
- `subdomain` - Fast lookup by subdomain (unique)
- `is_active` - Filtering active subdomains
- `is_primary, organization_id` - Composite for primary subdomain queries

### Flow Diagram

```
┌─────────────────────────────────┐
│   User visits admin page        │
│   /app/organization/subdomains  │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  SubdomainManager Component     │
│  (components/subdomain-manager) │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────────┬──────────┬──────────┐
        │                 │          │          │
        ▼                 ▼          ▼          ▼
     GET POST          PATCH       DELETE    UI State
        │                 │          │          │
        └──────┬──────────┴──────────┴──────────┘
               │
               ▼
┌─────────────────────────────────┐
│  /api/subdomains route handler  │
│  (app/api/subdomains/route.ts)  │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────────┬──────────┬──────────┐
        │                 │          │          │
        ▼                 ▼          ▼          ▼
      Drizzle ORM queries on subdomain_config table
      ├── List all org subdomains (GET)
      ├── Create new subdomain (POST)
      ├── Update subdomain settings (PATCH)
      └── Delete subdomain (DELETE)
               │
               ▼
┌─────────────────────────────────┐
│  Middleware (proxy.ts)          │
│  Looks up subdomain in DB       │
└──────────────┬──────────────────┘
               │
        ┌──────┴──────────────┐
        │                     │
        ▼                     ▼
    Subdomain found      Subdomain not found
    Set X-Tenant-ID      Return null
    in request header    (use default)
```

## Frontend Implementation

### SubdomainManager Component

Location: `components/subdomain-manager.tsx`

**Features:**
- ✅ List active subdomains
- ✅ Create new subdomain with validation
- ✅ Set primary subdomain
- ✅ Toggle active/inactive status
- ✅ Delete subdomains
- ✅ Real-time error/success messages
- ✅ DNS configuration reminder

**Usage:**

```tsx
import { SubdomainManager } from "@/components/subdomain-manager"

export default function SubdomainPage() {
  return (
    <div className="p-6">
      <h1>Manage Subdomains</h1>
      <SubdomainManager />
    </div>
  )
}
```

### Validation Rules

1. **Subdomain Format** (RFC 1123):
   - Lowercase letters, numbers, hyphens only
   - Must start and end with alphanumeric
   - Max 63 characters
   - Pattern: `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`

2. **Reserved Subdomains** (Cannot be used):
   ```
   www, app, api, admin, docs, blog, status, cdn
   ```
   (Configurable via `NEXT_PUBLIC_PUBLIC_SUBDOMAINS` env var)

3. **Uniqueness**:
   - Subdomain must be globally unique (across all organizations)
   - Database constraint: `UNIQUE(subdomain)`

### API Endpoints

#### GET /api/subdomains
List all subdomains for the authenticated organization.

**Headers:**
```
X-Tenant-ID: <organization-id>
```

**Response:**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "subdomain": "tenant1",
    "organizationId": "550e8400-e29b-41d4-a716-446655440001",
    "teamId": null,
    "isActive": true,
    "isPrimary": true,
    "createdBy": "550e8400-e29b-41d4-a716-446655440002",
    "customization": {
      "brandColor": "#0066FF",
      "logo": "https://...",
      "description": "Production workspace"
    },
    "createdAt": "2026-02-02T10:00:00Z",
    "updatedAt": "2026-02-02T10:00:00Z"
  }
]
```

#### POST /api/subdomains
Create a new subdomain for the organization.

**Headers:**
```
X-Tenant-ID: <organization-id>
X-User-ID: <user-id>
```

**Request Body:**
```json
{
  "subdomain": "acme-corp",
  "teamId": null,
  "customization": {
    "brandColor": "#FF6600",
    "logo": null,
    "description": "ACME Corp workspace"
  },
  "isPrimary": false
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "subdomain": "acme-corp",
  "organizationId": "550e8400-e29b-41d4-a716-446655440001",
  "teamId": null,
  "isActive": true,
  "isPrimary": false,
  "createdBy": "550e8400-e29b-41d4-a716-446655440002",
  "customization": {...},
  "createdAt": "2026-02-02T10:30:00Z",
  "updatedAt": "2026-02-02T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid subdomain format
- `409 Conflict`: Subdomain already in use

#### PATCH /api/subdomains
Update a subdomain configuration.

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "isActive": false,
  "isPrimary": true,
  "customization": {
    "brandColor": "#FF0000"
  }
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "subdomain": "acme-corp",
  "isActive": false,
  "isPrimary": true,
  "customization": {...},
  "updatedAt": "2026-02-02T10:45:00Z"
}
```

#### DELETE /api/subdomains
Delete a subdomain configuration.

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003"
}
```

**Response:** `200 OK`
```json
{
  "success": true
}
```

## Middleware Integration

### proxy.ts Enhancement

The middleware now resolves subdomains as follows:

```typescript
function inferTenantFromHost(host: string | null): string | null {
  // 1. Extract subdomain from hostname
  // 2. Check if it's in PUBLIC_SUBDOMAINS → return null
  // 3. Validate RFC 1123 format → return null if invalid
  // 4. Return subdomain as tenant ID
  
  // Future: Query subdomain_config table for dynamic mappings
  // const config = await db
  //   .select()
  //   .from(subdomainConfig)
  //   .where(eq(subdomainConfig.subdomain, subdomain))
  // return config[0]?.organizationId || null
}
```

**Current behavior:**
- Subdomain is returned as-is (e.g., "tenant1")
- Mapped to organization via request context

**Future enhancement:**
- Query `subdomain_config` table to map subdomain → organization ID
- Support custom branding per subdomain from `customization` JSONB

## Database Migration

Run the migration to create the `subdomain_config` table:

```bash
# Using Drizzle Kit
pnpm drizzle-kit push

# Or manually
psql $DATABASE_URL < drizzle/0006_add_subdomain_config.sql
```

## Usage Example

### Admin Interface

```tsx
// app/(app)/app/(orchestration)/settings/subdomains/page.tsx
import { SubdomainManager } from "@/components/subdomain-manager"

export default function SubdomainsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subdomain Management</h1>
        <p className="text-muted-foreground">
          Configure custom subdomains for your organization
        </p>
      </div>
      <SubdomainManager />
    </div>
  )
}
```

### Create Subdomain via API

```typescript
// Create a new subdomain programmatically
const response = await fetch("/api/subdomains", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-ID": organizationId,
    "X-User-ID": userId,
  },
  body: JSON.stringify({
    subdomain: "customer-acme",
    customization: {
      brandColor: "#0066FF",
      description: "ACME Corp workspace",
    },
    isPrimary: true,
  }),
})

if (response.ok) {
  const config = await response.json()
  console.log(`Subdomain created: ${config.subdomain}.nexuscanon.com`)
}
```

### Access Tenant-Specific Data

```typescript
// In a server component, get the tenant from subdomain
import { getTenantContext } from "@/lib/server/tenant/context"

export default async function TenantPage() {
  const { tenantId } = await getTenantContext()
  
  // tenantId is the subdomain (e.g., "acme-corp")
  // Use it to filter data, configure UI, apply branding, etc.
  
  return (
    <div>
      <h1>Workspace: {tenantId}</h1>
      {/* Tenant-specific content */}
    </div>
  )
}
```

## Security Considerations

### 1. Authorization
- Only authenticated users can manage subdomains
- Users must belong to the organization (via X-Tenant-ID header)
- Subdomain operations are org-scoped

### 2. Data Isolation
- Subdomains are unique across the entire platform
- Each organization can have multiple subdomains
- Subdomain-to-organization mapping is controlled by the database

### 3. Input Validation
- Subdomain format validated on client and server
- Reserved subdomains blocked in API
- SQL injection prevented via Drizzle ORM (parameterized queries)

### 4. Rate Limiting (Recommended)
```typescript
// app/api/subdomains/route.ts - add rate limiting
import { rateLimit } from "@/lib/middleware/rate-limit"

export async function POST(req: Request) {
  // Rate limit: 10 requests per hour per organization
  await rateLimit(req, { limit: 10, window: "1h" })
  // ... rest of handler
}
```

## Troubleshooting

### "Subdomain not found" Error
- Verify subdomain exists in `subdomain_config` table
- Check `is_active` flag (must be `true`)
- Confirm organization ID matches

### Subdomain not resolving
- Verify DNS wildcard record (`*`) is configured on Vercel
- Check that middleware is loading subdomain config correctly
- Test with direct API call: `curl https://subdomain.nexuscanon.com/api/subdomains`

### Customization not applying
- Verify `customization` JSONB field is set
- Implement customization rendering in layout components
- Check that server component can access `customization` data

## Future Enhancements

1. **Dynamic Branding**
   - Store `customization.brandColor`, `logo` in `subdomain_config`
   - Render branding in layout based on resolved subdomain

2. **Subdomain Analytics**
   - Track subdomain usage, access patterns
   - Show traffic per subdomain in admin dashboard

3. **Subdomain Aliases**
   - Allow multiple subdomains per organization
   - Support legacy domain names during migrations

4. **Webhook Integration**
   - Trigger webhooks when subdomain is created/deleted
   - Integrate with external DNS providers (Cloudflare, Route53)

5. **Bulk Operations**
   - Batch create/delete subdomains
   - Import subdomain configurations from CSV

## References

- [Vercel Platforms](https://github.com/vercel/platforms) - Original inspiration
- [RFC 1123 DNS Labels](https://tools.ietf.org/html/rfc1123)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Multi-Tenancy Best Practices](https://docs.vercel.com/concepts/platform-best-practices)
