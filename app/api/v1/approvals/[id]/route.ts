import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { UpdateApprovalStatusSchema } from "@/lib/contracts/approvals"
import { HttpError, NotFound, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import {
  getApprovalById,
  updateApprovalStatus,
} from "@/lib/server/db/queries/approval.queries"

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [{ id }, auth, tenant] = await Promise.all([
      ctx.params,
      getAuthContext(),
      getTenantContext(),
    ])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const { status } = await parseJson(req, UpdateApprovalStatusSchema)

    const existing = await getApprovalById(tenantId, id)
    if (!existing) throw NotFound("Approval not found")

    const updated = await updateApprovalStatus(tenantId, id, status)
    if (!updated) throw NotFound("Approval not found")

    invalidateTag(cacheTags.approvals(tenantId))
    invalidateTag(cacheTags.approval(id))
    return ok(updated)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

