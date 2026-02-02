/**
 * @domain magictodo
 * @layer api
 * @responsibility API route handler for /api/v1/projects
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { createProjectRequestSchema, projectQuerySchema } from "@/lib/contracts/tasks"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson, parseSearchParams } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { createProject, listProjects, listAllProjects } from "@/lib/server/db/queries/projects"
import { withRlsDbEx } from "@/lib/server/db/rls"
import { resolveTenantScopeInDb } from "@/lib/server/tenant/resolve-scope"

export async function GET(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const url = new URL(request.url)
    const query = parseSearchParams(url.searchParams, projectQuerySchema)
    const includeArchived = query.includeArchived

    const projects = await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(tenantId, db)
      const requireTenantMapping =
        process.env.NODE_ENV === "production" || process.env.REQUIRE_TENANT_MAPPING === "true"
      if (requireTenantMapping && !scope.organizationId) {
        throw Unauthorized("Tenant mapping required")
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      return includeArchived
        ? await listAllProjects(auth.userId, scope.organizationId, db)
        : await listProjects(auth.userId, scope.organizationId, db)
    })

    return ok({ items: projects })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

export async function POST(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, createProjectRequestSchema)
    const project = await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(tenantId, db)
      const requireTenantMapping =
        process.env.NODE_ENV === "production" || process.env.REQUIRE_TENANT_MAPPING === "true"
      if (requireTenantMapping && !scope.organizationId) {
        throw Unauthorized("Tenant mapping required")
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      return await createProject(auth.userId, body, scope.organizationId, db)
    })

    invalidateTag(cacheTags.projects(tenantId))
    return ok(project)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

