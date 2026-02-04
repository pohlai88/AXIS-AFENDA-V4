/**
 * @domain magicfolder
 * @layer api
 * @responsibility API routes for MagicFolder user preferences
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { UpdateUserPreferencesSchema } from "@/lib/contracts/magicfolder-saved-views"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { db } from "@/lib/server/db"
import { magicfolderUserPreferences } from "@/lib/server/db/schema"
import { and, eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

/**
 * GET /api/v1/magicfolder/preferences
 * Get user preferences for MagicFolder
 */
export async function GET() {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    // Get or create preferences
    let [result] = await db
      .select()
      .from(magicfolderUserPreferences)
      .where(
        and(
          eq(magicfolderUserPreferences.userId, auth.userId),
          eq(magicfolderUserPreferences.tenantId, tenantId)
        )
      )

    if (!result) {
      // Create default preferences
      [result] = await db
        .insert(magicfolderUserPreferences)
        .values({
          tenantId,
          userId: auth.userId,
        })
        .returning()
    }

    return ok({
      preferences: {
        id: result.id,
        tenantId: result.tenantId,
        userId: result.userId,
        defaultView: result.defaultView as any,
        itemsPerPage: result.itemsPerPage as any,
        defaultSort: result.defaultSort,
        showFileExtensions: result.showFileExtensions,
        showThumbnails: result.showThumbnails,
        compactMode: result.compactMode,
        quickSettings: result.quickSettings as any,
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
 * PUT /api/v1/magicfolder/preferences
 * Update user preferences for MagicFolder
 */
export async function PUT(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, UpdateUserPreferencesSchema)

    // When updating quickSettings, merge with existing so other keys are preserved
    let quickSettingsToSet = body.quickSettings
    if (body.quickSettings && typeof body.quickSettings === "object") {
      const [existing] = await db
        .select({ quickSettings: magicfolderUserPreferences.quickSettings })
        .from(magicfolderUserPreferences)
        .where(
          and(
            eq(magicfolderUserPreferences.userId, auth.userId),
            eq(magicfolderUserPreferences.tenantId, tenantId)
          )
        )
        .limit(1)
      const existingQs = (existing?.quickSettings as Record<string, unknown>) ?? {}
      quickSettingsToSet = { ...existingQs, ...body.quickSettings }
    }

    // Upsert preferences
    const [result] = await db
      .insert(magicfolderUserPreferences)
      .values({
        tenantId,
        userId: auth.userId,
        ...(body.defaultView && { defaultView: body.defaultView }),
        ...(body.itemsPerPage && { itemsPerPage: body.itemsPerPage }),
        ...(body.defaultSort && { defaultSort: body.defaultSort }),
        ...(body.showFileExtensions !== undefined && { showFileExtensions: body.showFileExtensions }),
        ...(body.showThumbnails !== undefined && { showThumbnails: body.showThumbnails }),
        ...(body.compactMode !== undefined && { compactMode: body.compactMode }),
        ...(quickSettingsToSet && { quickSettings: quickSettingsToSet }),
      })
      .onConflictDoUpdate({
        target: [magicfolderUserPreferences.tenantId, magicfolderUserPreferences.userId],
        set: {
          ...(body.defaultView && { defaultView: body.defaultView }),
          ...(body.itemsPerPage && { itemsPerPage: body.itemsPerPage }),
          ...(body.defaultSort && { defaultSort: body.defaultSort }),
          ...(body.showFileExtensions !== undefined && { showFileExtensions: body.showFileExtensions }),
          ...(body.showThumbnails !== undefined && { showThumbnails: body.showThumbnails }),
          ...(body.compactMode !== undefined && { compactMode: body.compactMode }),
          ...(quickSettingsToSet && { quickSettings: quickSettingsToSet }),
        },
      })
      .returning()

    return ok({
      preferences: {
        id: result.id,
        tenantId: result.tenantId,
        userId: result.userId,
        defaultView: result.defaultView as any,
        itemsPerPage: result.itemsPerPage as any,
        defaultSort: result.defaultSort,
        showFileExtensions: result.showFileExtensions,
        showThumbnails: result.showThumbnails,
        compactMode: result.compactMode,
        quickSettings: result.quickSettings as any,
        createdAt: (result.createdAt ?? new Date()).toISOString(),
        updatedAt: (result.updatedAt ?? new Date()).toISOString(),
      },
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
