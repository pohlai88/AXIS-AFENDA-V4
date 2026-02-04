/**
 * @domain magicfolder
 * @layer api
 * @responsibility API routes for MagicFolder tenant settings
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { UpdateTenantSettingsSchema } from "@/lib/contracts/magicfolder-saved-views"
import { HttpError, Unauthorized, Forbidden } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { db } from "@/lib/server/db"
import { magicfolderTenantSettings } from "@/lib/server/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

/**
 * GET /api/v1/magicfolder/tenant-settings
 * Get tenant settings for MagicFolder
 */
export async function GET() {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    // Get or create tenant settings
    let [result] = await db
      .select()
      .from(magicfolderTenantSettings)
      .where(
        eq(magicfolderTenantSettings.tenantId, tenantId)
      )

    if (!result) {
      // Create default tenant settings
      [result] = await db
        .insert(magicfolderTenantSettings)
        .values({
          tenantId,
        })
        .returning()
    }

    return ok({
      settings: {
        id: result.id,
        tenantId: result.tenantId,
        documentTypes: result.documentTypes as any,
        statusWorkflow: result.statusWorkflow as any,
        enableAiSuggestions: result.enableAiSuggestions,
        enablePublicShares: result.enablePublicShares,
        maxFileSizeMb: result.maxFileSizeMb,
        allowedFileTypes: result.allowedFileTypes,
        createdAt: (result.createdAt ?? new Date()).toISOString(),
        updatedAt: (result.updatedAt ?? new Date()).toISOString(),
      },
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

/**
 * PUT /api/v1/magicfolder/tenant-settings
 * Update tenant settings for MagicFolder (admin only)
 */
export async function PUT(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const elevatedRoles = new Set(["owner", "admin", "tenant_admin", "super_admin"])
    const hasElevatedRole = auth.roles.some((role) => elevatedRoles.has(role))
    if (!hasElevatedRole) throw Forbidden("Admin access required")

    const body = await parseJson(request, UpdateTenantSettingsSchema)

    // Upsert tenant settings
    const [result] = await db
      .insert(magicfolderTenantSettings)
      .values({
        tenantId,
        ...(body.documentTypes && { documentTypes: body.documentTypes }),
        ...(body.statusWorkflow && { statusWorkflow: body.statusWorkflow }),
        ...(body.enableAiSuggestions !== undefined && { enableAiSuggestions: body.enableAiSuggestions }),
        ...(body.enablePublicShares !== undefined && { enablePublicShares: body.enablePublicShares }),
        ...(body.maxFileSizeMb && { maxFileSizeMb: body.maxFileSizeMb }),
        ...(body.allowedFileTypes && { allowedFileTypes: body.allowedFileTypes }),
      })
      .onConflictDoUpdate({
        target: magicfolderTenantSettings.tenantId,
        set: {
          ...(body.documentTypes && { documentTypes: body.documentTypes }),
          ...(body.statusWorkflow && { statusWorkflow: body.statusWorkflow }),
          ...(body.enableAiSuggestions !== undefined && { enableAiSuggestions: body.enableAiSuggestions }),
          ...(body.enablePublicShares !== undefined && { enablePublicShares: body.enablePublicShares }),
          ...(body.maxFileSizeMb && { maxFileSizeMb: body.maxFileSizeMb }),
          ...(body.allowedFileTypes && { allowedFileTypes: body.allowedFileTypes }),
        },
      })
      .returning()

    return ok({
      settings: {
        id: result.id,
        tenantId: result.tenantId,
        documentTypes: result.documentTypes as any,
        statusWorkflow: result.statusWorkflow as any,
        enableAiSuggestions: result.enableAiSuggestions,
        enablePublicShares: result.enablePublicShares,
        maxFileSizeMb: result.maxFileSizeMb,
        allowedFileTypes: result.allowedFileTypes,
        createdAt: (result.createdAt ?? new Date()).toISOString(),
        updatedAt: (result.updatedAt ?? new Date()).toISOString(),
      },
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
