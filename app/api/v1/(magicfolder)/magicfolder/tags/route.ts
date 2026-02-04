/**
 * @domain magicfolder
 * @layer api
 * @responsibility List tags for tenant; create tag (POST)
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { MagicfolderCreateTagRequestSchema } from "@/lib/contracts/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { listTagsByTenant, createTag } from "@/lib/server/magicfolder/tags"
import { logger } from "@/lib/server/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  let tenantId: string | null | undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const tags = await listTagsByTenant(tenantId)
    return ok({ items: tags })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)

    const errorDetails = {
      err: e,
      requestId,
      tenantId,
      errorName: e instanceof Error ? e.name : 'Unknown',
      errorMessage: e instanceof Error ? e.message : 'Internal error',
      stack: e instanceof Error ? e.stack : undefined,
    }

    logger.error(errorDetails, '[tags/GET] Failed to list tags')
    return fail({
      code: "INTERNAL",
      message: e instanceof Error ? e.message : "Internal error",
      requestId
    }, 500)
  }
}

export async function POST(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, MagicfolderCreateTagRequestSchema)
    const result = await createTag(tenantId, body.name)
    if (!result.ok) throw new HttpError(400, "BAD_REQUEST", result.error)
    return ok({ tag: result.tag })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
