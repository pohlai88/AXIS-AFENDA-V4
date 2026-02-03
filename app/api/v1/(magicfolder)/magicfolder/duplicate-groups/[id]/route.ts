/**
 * @domain magicfolder
 * @layer api
 * @responsibility Dismiss (delete) a duplicate group — "Not duplicates"
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { dismissDuplicateGroup } from "@/lib/server/magicfolder/list"

export const dynamic = "force-dynamic"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const { id: groupId } = await params
    if (!groupId) {
      return fail({ code: "BAD_REQUEST", message: "Missing group id", requestId }, 400)
    }

    const { deleted } = await dismissDuplicateGroup(tenantId, groupId)
    if (!deleted) {
      return fail(
        { code: "NOT_FOUND", message: "Duplicate group not found or access denied", requestId },
        404
      )
    }

    return new Response(null, { status: 204 })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
