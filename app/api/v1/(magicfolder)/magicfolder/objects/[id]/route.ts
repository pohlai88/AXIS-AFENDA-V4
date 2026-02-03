/**
 * @domain magicfolder
 * @layer api
 * @responsibility Get/update single document (object) by id with versions
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { MagicfolderUpdateStatusRequestSchema } from "@/lib/contracts/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getObjectById } from "@/lib/server/magicfolder/list"
import { updateObjectStatus } from "@/lib/server/magicfolder/update"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id } = await params

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const object = await getObjectById(tenantId, id)
    if (!object) throw new HttpError(404, "NOT_FOUND", "Document not found")

    return ok(object)
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
  const { id } = await params

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, MagicfolderUpdateStatusRequestSchema)
    const result = await updateObjectStatus(tenantId, id, body.status)
    if (!result.ok) {
      if (result.error === "Object not found") throw new HttpError(404, "NOT_FOUND", result.error)
      throw new HttpError(400, "BAD_REQUEST", result.error)
    }
    return ok({ ok: true })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
