/**
 * @domain magicfolder
 * @layer api
 * @responsibility Set keepVersionId on duplicate group (Keep Best)
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { MagicfolderKeepBestRequestSchema } from "@/lib/contracts/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { setKeepBest } from "@/lib/server/magicfolder/keep-best"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, MagicfolderKeepBestRequestSchema)

    const result = await setKeepBest(body.groupId, body.versionId, tenantId, auth.userId)
    if (!result.ok) {
      if (result.error === "Group not found" || result.error === "Forbidden") {
        throw new HttpError(404, "NOT_FOUND", result.error)
      }
      if (result.error.includes("not in this duplicate group")) {
        throw new HttpError(400, "BAD_REQUEST", result.error)
      }
      throw new HttpError(500, "KEEP_BEST_FAILED", result.error)
    }

    return ok({ groupId: result.groupId })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
