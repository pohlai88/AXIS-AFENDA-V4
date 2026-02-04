/**
 * @domain magicfolder
 * @layer api
 * @responsibility Duplicate document (object + current version), return new object id
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { duplicateObject } from "@/lib/server/magicfolder/duplicate-object"
import { isR2Configured } from "@/lib/server/r2/client"

export const dynamic = "force-dynamic"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id } = await params

  try {
    if (!isR2Configured()) {
      return fail(
        { code: "UNAVAILABLE", message: "Storage not configured", requestId },
        503
      )
    }

    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const result = await duplicateObject(tenantId, auth.userId, id)
    if (!result.ok) {
      if (result.error === "Object or version not found") {
        throw new HttpError(404, "NOT_FOUND", result.error)
      }
      throw new HttpError(400, "BAD_REQUEST", result.error)
    }
    return ok({ objectId: result.objectId, versionId: result.versionId })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
