/**
 * @domain magicfolder
 * @layer api
 * @responsibility Finalize upload: copy quarantine → canonical, create object/version, exact-dupe check
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { MagicfolderIngestRequestSchema } from "@/lib/contracts/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { finalizeIngest } from "@/lib/server/magicfolder/ingest"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, MagicfolderIngestRequestSchema)

    const result = await finalizeIngest(body.uploadId, tenantId, auth.userId)
    if (!result.ok) {
      if (result.error === "Upload not found" || result.error === "Forbidden") {
        throw new HttpError(404, "NOT_FOUND", result.error)
      }
      if (result.error.startsWith("Invalid upload status")) {
        throw new HttpError(400, "BAD_REQUEST", result.error)
      }
      throw new HttpError(500, "INGEST_FAILED", result.error)
    }

    return ok({
      objectId: result.objectId,
      versionId: result.versionId,
      duplicateGroupId: result.duplicateGroupId ?? null,
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
