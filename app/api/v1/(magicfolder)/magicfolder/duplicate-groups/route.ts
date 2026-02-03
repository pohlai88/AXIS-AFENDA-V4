/**
 * @domain magicfolder
 * @layer api
 * @responsibility List duplicate groups with versions for tenant
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { listDuplicateGroups } from "@/lib/server/magicfolder/list"

export const dynamic = "force-dynamic"

const DEFAULT_LIMIT = 20
const DEFAULT_OFFSET = 0

export async function GET(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const url = new URL(request.url)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT))
    const offset = Math.max(0, Number(url.searchParams.get("offset")) || DEFAULT_OFFSET)

    const result = await listDuplicateGroups(tenantId, limit, offset)

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
