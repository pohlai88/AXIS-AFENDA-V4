import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { updateDesignSystemRequestSchema } from "@/lib/contracts/tenant-design-system"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { cacheTags } from "@/lib/server/cache/tags"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { logger } from "@/lib/server/logger"
import {
  getTenantDesignSystem,
  upsertTenantDesignSystem,
} from "@/lib/server/db/queries/tenant-design-system"

/**
 * GET /api/v1/tenant/design-system
 * Get current tenant's design system settings (or defaults)
 */
export async function GET() {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const result = await getTenantDesignSystem(tenantId)

    return ok({
      tenantId: result.tenantId,
      settings: result.settings,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    logger.error({ error: e, requestId }, "[design-system] GET error")
    return fail({
      code: "INTERNAL",
      message: e instanceof Error ? e.message : "Internal error",
      requestId
    }, 500)
  }
}

/**
 * PUT /api/v1/tenant/design-system
 * Update tenant's design system settings
 */
export async function PUT(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, updateDesignSystemRequestSchema)
    const result = await upsertTenantDesignSystem(tenantId, body)

    // Invalidate tenant design system cache
    invalidateTag(cacheTags.tenantDesignSystem(tenantId))

    return ok({
      tenantId: result.tenantId,
      settings: result.settings,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    logger.error({ error: e, requestId }, "[design-system] PUT error")
    return fail({
      code: "INTERNAL",
      message: e instanceof Error ? e.message : "Internal error",
      requestId
    }, 500)
  }
}
