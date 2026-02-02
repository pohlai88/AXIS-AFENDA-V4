/**
 * @domain magictodo
 * @layer api
 * @responsibility API route handler for /api/v1/tasks
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { createTaskRequestSchema, taskQuerySchema } from "@/lib/contracts/tasks"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson, parseSearchParams } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { listTasks, createTask } from "@/lib/server/db/queries/tasks"

// Route Segment Config: Auth-dependent routes must be dynamic
export const dynamic = 'force-dynamic'

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
    const query = parseSearchParams(url.searchParams, taskQuerySchema)

    const result = await listTasks(
      auth.userId,
      { status: query.status, priority: query.priority, projectId: query.projectId },
      { limit: query.limit, offset: query.offset }
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

