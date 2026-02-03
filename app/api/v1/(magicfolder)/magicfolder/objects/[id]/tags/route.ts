/**
 * @domain magicfolder
 * @layer api
 * @responsibility Add or remove tag on object
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { addTagToObject, removeTagFromObject } from "@/lib/server/magicfolder/tags"
import { z } from "zod"

export const dynamic = "force-dynamic"

const AddTagSchema = z.object({ tagId: z.string().uuid() })

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id: objectId } = await params

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(_request, AddTagSchema)
    const result = await addTagToObject(tenantId, objectId, body.tagId)
    if (!result.ok) throw new HttpError(400, "BAD_REQUEST", result.error)
    return ok({ ok: true })
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
  const { id: objectId } = await params
  const tagId = new URL(request.url).searchParams.get("tagId")
  if (!tagId) {
    return fail(
      { code: "BAD_REQUEST", message: "tagId query param required", requestId },
      400
    )
  }

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const result = await removeTagFromObject(tenantId, objectId, tagId)
    if (!result.ok) throw new HttpError(400, "BAD_REQUEST", result.error)
    return ok({ ok: true })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
