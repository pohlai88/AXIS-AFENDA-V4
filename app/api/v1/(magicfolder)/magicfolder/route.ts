/**
 * @domain magicfolder
 * @layer api
 * @responsibility List documents (objects) for tenant with optional status filter
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { MagicfolderListQuerySchema } from "@/lib/contracts/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseSearchParams } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { listObjects } from "@/lib/server/magicfolder/list"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const url = new URL(request.url)
    const query = parseSearchParams(url.searchParams, MagicfolderListQuerySchema)

    const result = await listObjects(tenantId, {
      status: query.status,
      docType: query.docType,
      q: query.q,
      tagId: query.tagId,
      hasTags: query.hasTags,
      hasType: query.hasType,
      dupGroup: query.dupGroup,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      limit: query.limit,
      offset: query.offset,
    })

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
