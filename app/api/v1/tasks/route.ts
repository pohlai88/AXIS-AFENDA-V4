import "@/lib/server/only"

import { headers } from "next/headers"

import { headerNames } from "@/lib/constants/headers"
import { createTaskRequestSchema } from "@/lib/contracts/tasks"
import { HttpError, Unauthorized, BadRequest } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { listTasks, createTask } from "@/lib/server/db/queries/tasks"

/**
 * GET /api/v1/tasks
 * List tasks for current tenant
 * Query params: ?status=todo&priority=high&limit=50&offset=0
 */
export async function GET(request: Request) {
  const requestId = (await headers()).get(headerNames.requestId) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    // Parse query parameters
    const url = new URL(request.url)
    const status = url.searchParams.get("status") || undefined
    const priority = url.searchParams.get("priority") || undefined
    const projectId = url.searchParams.get("projectId") || undefined
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100)
    const offset = parseInt(url.searchParams.get("offset") || "0")

    if (isNaN(limit) || isNaN(offset) || limit < 1) {
      throw BadRequest("Invalid pagination parameters")
    }

    const result = await listTasks(
      tenantId,
      { status, priority, projectId },
      { limit, offset }
    )

    return ok({
      items: result.items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

/**
 * POST /api/v1/tasks
 * Create a new task
 */
export async function POST(request: Request) {
  const requestId = (await headers()).get(headerNames.requestId) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, createTaskRequestSchema)
    const task = await createTask(tenantId, {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    })

    invalidateTag(cacheTags.tasks(tenantId))
    return ok(task, { status: 201 })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
