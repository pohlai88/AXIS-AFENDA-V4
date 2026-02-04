/**
 * @domain magicfolder
 * @layer api
 * @responsibility Hash audit: sample versions, verify R2 object SHA-256 matches DB
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { runHashAudit } from "@/lib/server/magicfolder/hash-audit"
import { isR2Configured } from "@/lib/server/r2/client"

export const dynamic = "force-dynamic"

const MAX_SAMPLE = 100

export async function GET(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const url = new URL(request.url)
  const sampleParam = url.searchParams.get("sample")
  const sampleSize = Math.min(
    Math.max(1, parseInt(sampleParam ?? "20", 10) || 20),
    MAX_SAMPLE
  )

  try {
    if (!isR2Configured()) {
      return fail(
        { code: "UNAVAILABLE", message: "Storage not configured", requestId },
        503
      )
    }

    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    if (!tenant.tenantId) throw Unauthorized("Missing tenant")

    const result = await runHashAudit(sampleSize)
    return ok(result)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
