/**
 * @domain magictodo
 * @layer api
 * @responsibility API route handler for /api/v1/projects/:id
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { updateProjectRequestSchema, projectParamsSchema } from "@/lib/contracts/tasks"
import { HttpError, Unauthorized, NotFound } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getProject, updateProject, deleteProjectScoped } from "@/lib/server/db/queries/projects"
import { withRlsDbEx } from "@/lib/server/db/rls"
import { resolveTenantScopeInDb } from "@/lib/server/tenant/resolve-scope"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const rawParams = await params
    const { id } = projectParamsSchema.parse(rawParams)
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const project = await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(tenantId, db)
      const requireTenantMapping =
        process.env.NODE_ENV === "production" || process.env.REQUIRE_TENANT_MAPPING === "true"
      if (requireTenantMapping && !scope.organizationId) {
        throw Unauthorized("Tenant mapping required")
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      return await getProject(auth.userId, id, scope.organizationId, scope.teamId, db)
    })
    if (!project) throw NotFound("Project not found")

    return ok(project)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const rawParams = await params
    const { id } = projectParamsSchema.parse(rawParams)
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, updateProjectRequestSchema)
    const updated = await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(tenantId, db)
      const requireTenantMapping =
        process.env.NODE_ENV === "production" || process.env.REQUIRE_TENANT_MAPPING === "true"
      if (requireTenantMapping && !scope.organizationId) {
        throw Unauthorized("Tenant mapping required")
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      return await updateProject(auth.userId, id, body, scope.organizationId, scope.teamId, db)
    })
    if (!updated) throw NotFound("Project not found")

    invalidateTag(cacheTags.projects(tenantId))
    return ok(updated)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const rawParams = await params
    const { id } = projectParamsSchema.parse(rawParams)
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const deleted = await withRlsDbEx({ userId: auth.userId }, async (db, sql) => {
      const scope = await resolveTenantScopeInDb(tenantId, db)
      const requireTenantMapping =
        process.env.NODE_ENV === "production" || process.env.REQUIRE_TENANT_MAPPING === "true"
      if (requireTenantMapping && !scope.organizationId) {
        throw Unauthorized("Tenant mapping required")
      }

      await sql`select set_config('app.organization_id', ${scope.organizationId ?? ""}, true);`
      await sql`select set_config('app.team_id', ${scope.teamId ?? ""}, true);`

      return await deleteProjectScoped(auth.userId, id, scope.organizationId, scope.teamId, db)
    })
    if (!deleted) throw NotFound("Project not found")

    invalidateTag(cacheTags.projects(tenantId))
    return ok(deleted)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

