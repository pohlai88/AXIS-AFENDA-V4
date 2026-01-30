import "@/lib/server/only"

import { headers } from "next/headers"

import { headerNames } from "@/lib/constants/headers"
import { updateTaskRequestSchema } from "@/lib/contracts/tasks"
import { HttpError, Unauthorized, NotFound } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getTask, updateTask, deleteTask } from "@/lib/server/db/queries/tasks"

/**
 * GET /api/v1/tasks/[id]
 * Get single task
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(headerNames.requestId) ?? undefined

  try {
    const { id } = await params
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const task = await getTask(tenantId, id)
    if (!task) throw NotFound("Task not found")

    return ok(task)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

/**
 * PATCH /api/v1/tasks/[id]
 * Update task
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(headerNames.requestId) ?? undefined

  try {
    const { id } = await params
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, updateTaskRequestSchema)
    const updated = await updateTask(tenantId, id, {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    })
    if (!updated) throw NotFound("Task not found")

    invalidateTag(cacheTags.tasks(tenantId))
    return ok(updated)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

/**
 * DELETE /api/v1/tasks/[id]
 * Delete task
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(headerNames.requestId) ?? undefined

  try {
    const { id } = await params
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const deleted = await deleteTask(tenantId, id)
    if (!deleted) throw NotFound("Task not found")

    invalidateTag(cacheTags.tasks(tenantId))
    return ok({ success: true })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
