import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { createProjectRequestSchema } from "@/lib/contracts/tasks"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { createProject, listProjects, listAllProjects } from "@/lib/server/db/queries/projects"

export async function GET(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const url = new URL(request.url)
    const includeArchived = url.searchParams.get("includeArchived") === "true"

    const projects = includeArchived
      ? await listAllProjects(auth.userId)
      : await listProjects(auth.userId)

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
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, createProjectRequestSchema)
    const project = await createProject(auth.userId, body)

    invalidateTag(cacheTags.projects(tenantId))
    return ok(project)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
