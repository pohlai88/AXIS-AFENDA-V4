import "@/lib/server/only"
import { headers } from "next/headers"
import { eq, and } from "drizzle-orm"
import { subdomainConfig } from "@/lib/server/db/schema"
import { HEADER_NAMES } from "@/lib/constants"
import { ok, fail } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { withRlsDbEx } from "@/lib/server/db/rls"
import { resolveTenantScopeInDb } from "@/lib/server/tenant/resolve-scope"

export async function GET() {
  try {
    const headersList = await headers()
    const rawTenant = headersList.get(HEADER_NAMES.TENANT_ID)
    const auth = await getAuthContext()

    if (!auth.userId) {
      return fail({ code: "UNAUTHORIZED", message: "Authentication required" }, 401)
    }

    if (!rawTenant) {
      return fail({ code: "UNAUTHORIZED", message: "Tenant is required" }, 401)
    }

    const subdomains = await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(rawTenant, db)
      if (!scope.organizationId) {
        return fail({ code: "ACCESS_DENIED", message: "Unable to resolve organization for tenant" }, 403)
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      const rows = await db
        .select()
        .from(subdomainConfig)
        .where(eq(subdomainConfig.organizationId, scope.organizationId))
      return ok(rows)
    })

    return subdomains
  } catch {
    return fail({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch subdomains" }, 500)
  }
}

export async function POST(req: Request) {
  try {
    const headersList = await headers()
    const rawTenant = headersList.get(HEADER_NAMES.TENANT_ID)
    const auth = await getAuthContext()

    if (!auth.userId) {
      return fail({ code: "UNAUTHORIZED", message: "Authentication required" }, 401)
    }

    if (!rawTenant) {
      return fail({ code: "UNAUTHORIZED", message: "Tenant and User ID required" }, 401)
    }

    const body = await req.json()
    const { subdomain, teamId, customization, isPrimary } = body

    // Validate subdomain format
    if (!subdomain || !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i.test(subdomain)) {
      return fail({ code: "BAD_REQUEST", message: "Invalid subdomain format" }, 400)
    }

    // Check if subdomain is reserved
    const publicSubdomains = (
      process.env.NEXT_PUBLIC_PUBLIC_SUBDOMAINS ?? "www,app,api,admin,docs,blog,status,cdn"
    )
      .split(",")
      .map((s) => s.trim())
      .map((s) => s.toLowerCase())

    if (publicSubdomains.includes(subdomain.toLowerCase())) {
      return fail({ code: "BAD_REQUEST", message: "Subdomain is reserved" }, 400)
    }

    // Check if subdomain already exists
    return await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(rawTenant, db)
      if (!scope.organizationId) {
        return fail({ code: "ACCESS_DENIED", message: "Unable to resolve organization for tenant" }, 403)
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      // Check if subdomain already exists
      const existing = await db
        .select()
        .from(subdomainConfig)
        .where(eq(subdomainConfig.subdomain, subdomain.toLowerCase()))

      if (existing.length > 0) {
        return fail({ code: "CONFLICT", message: "Subdomain already in use" }, 409)
      }

      // If setting as primary, unset other primary subdomains for this org
      if (isPrimary) {
        await db
          .update(subdomainConfig)
          .set({ isPrimary: false })
          .where(and(eq(subdomainConfig.organizationId, scope.organizationId), eq(subdomainConfig.isPrimary, true)))
      }

      // Create subdomain config
      const result = await db
        .insert(subdomainConfig)
        .values({
          subdomain: subdomain.toLowerCase(),
          organizationId: scope.organizationId,
          teamId: teamId || null,
          createdBy: auth.userId,
          isPrimary: isPrimary ?? false,
          customization: customization || {},
        })
        .returning()

      return ok(result[0], { status: 201 })
    })
  } catch {
    return fail({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create subdomain" }, 500)
  }
}

export async function PATCH(req: Request) {
  try {
    const headersList = await headers()
    const rawTenant = headersList.get(HEADER_NAMES.TENANT_ID)
    const auth = await getAuthContext()

    if (!auth.userId) {
      return fail({ code: "UNAUTHORIZED", message: "Authentication required" }, 401)
    }

    if (!rawTenant) {
      return fail({ code: "UNAUTHORIZED", message: "Tenant is required" }, 401)
    }

    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return fail({ code: "BAD_REQUEST", message: "Subdomain ID required" }, 400)
    }
    return await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(rawTenant, db)
      if (!scope.organizationId) {
        return fail({ code: "ACCESS_DENIED", message: "Unable to resolve organization for tenant" }, 403)
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      // Verify ownership
      const config = await db
        .select()
        .from(subdomainConfig)
        .where(and(eq(subdomainConfig.id, id), eq(subdomainConfig.organizationId, scope.organizationId)))

      if (config.length === 0) {
        return fail({ code: "NOT_FOUND", message: "Subdomain not found" }, 404)
      }

      // If setting as primary, unset other primary subdomains
      if (updateData.isPrimary === true) {
        await db
          .update(subdomainConfig)
          .set({ isPrimary: false })
          .where(and(eq(subdomainConfig.organizationId, scope.organizationId), eq(subdomainConfig.isPrimary, true)))
      }

      const result = await db
        .update(subdomainConfig)
        .set(updateData)
        .where(eq(subdomainConfig.id, id))
        .returning()

      return ok(result[0])
    })
  } catch {
    return fail({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update subdomain" }, 500)
  }
}

export async function DELETE(req: Request) {
  try {
    const headersList = await headers()
    const rawTenant = headersList.get(HEADER_NAMES.TENANT_ID)
    const auth = await getAuthContext()

    if (!auth.userId) {
      return fail({ code: "UNAUTHORIZED", message: "Authentication required" }, 401)
    }

    if (!rawTenant) {
      return fail({ code: "UNAUTHORIZED", message: "Tenant is required" }, 401)
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return fail({ code: "BAD_REQUEST", message: "Subdomain ID required" }, 400)
    }
    return await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(rawTenant, db)
      if (!scope.organizationId) {
        return fail({ code: "ACCESS_DENIED", message: "Unable to resolve organization for tenant" }, 403)
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      // Verify ownership
      const config = await db
        .select()
        .from(subdomainConfig)
        .where(and(eq(subdomainConfig.id, id), eq(subdomainConfig.organizationId, scope.organizationId)))

      if (config.length === 0) {
        return fail({ code: "NOT_FOUND", message: "Subdomain not found" }, 404)
      }

      await db.delete(subdomainConfig).where(eq(subdomainConfig.id, id))
      return ok({ success: true })
    })
  } catch {
    return fail({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete subdomain" }, 500)
  }
}
