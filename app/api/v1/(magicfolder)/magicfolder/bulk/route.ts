/**
 * @domain magicfolder
 * @layer api
 * @responsibility Bulk actions: archive, add tag
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { MagicfolderBulkRequestSchema } from "@/lib/contracts/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { runBulkAction } from "@/lib/server/magicfolder/update"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, MagicfolderBulkRequestSchema)
    const result = await runBulkAction(
      tenantId,
      body.objectIds,
      body.action,
      body.tagId
    )
    if (!result.ok) {
      if (result.error.includes("tagId")) throw new HttpError(400, "BAD_REQUEST", result.error)
      throw new HttpError(400, "BAD_REQUEST", result.error)
    }
    return ok({ updated: result.updated })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
