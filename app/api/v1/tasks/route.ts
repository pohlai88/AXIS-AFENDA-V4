import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { createTaskRequestSchema, TaskPriority, TaskStatus } from "@/lib/contracts/tasks"
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
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    // Parse query parameters
    const url = new URL(request.url)
    const statusParam = url.searchParams.get("status") || undefined
    const priorityParam = url.searchParams.get("priority") || undefined
    const projectId = url.searchParams.get("projectId") || undefined
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100)
    const offset = parseInt(url.searchParams.get("offset") || "0")

    if (isNaN(limit) || isNaN(offset) || limit < 1) {
      throw BadRequest("Invalid pagination parameters")
    }

    const status = statusParam
      ? TaskStatus.safeParse(statusParam).data
      : undefined
    const priority = priorityParam
      ? TaskPriority.safeParse(priorityParam).data
      : undefined

    if (statusParam && !status) throw BadRequest("Invalid status")
    if (priorityParam && !priority) throw BadRequest("Invalid priority")

    const result = await listTasks(
      auth.userId,
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
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, createTaskRequestSchema)
    const task = await createTask(auth.userId, {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    })

    invalidateTag(cacheTags.tasks(auth.userId))
    return ok(task, { status: 201 })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
