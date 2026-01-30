import "@/lib/server/only"

import { headers } from "next/headers"

import { headerNames } from "@/lib/constants/headers"
import { CreateApprovalSchema } from "@/lib/contracts/approvals"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import {
  createApproval,
  listApprovals,
} from "@/lib/server/db/queries/approval.queries"

export async function GET() {
  const requestId = (await headers()).get(headerNames.requestId) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const rows = await listApprovals(tenantId)
    return ok(rows)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

export async function POST(req: Request) {
  const requestId = (await headers()).get(headerNames.requestId) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId ?? auth.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const { title } = await parseJson(req, CreateApprovalSchema)
    const created = await createApproval(tenantId, title)

    invalidateTag(cacheTags.approvals(tenantId))
    return ok(created, { status: 201 })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

