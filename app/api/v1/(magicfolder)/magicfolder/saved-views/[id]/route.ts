/**
 * @domain magicfolder
 * @layer api
 * @responsibility API routes for individual MagicFolder saved view operations
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { UpdateSavedViewSchema } from "@/lib/contracts/magicfolder-saved-views"
import { HttpError, Unauthorized, NotFound } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { db } from "@/lib/server/db"
import { magicfolderSavedViews } from "@/lib/server/db/schema"
import { eq, and, or } from "drizzle-orm"

export const dynamic = "force-dynamic"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/v1/magicfolder/saved-views/[id]
 * Get a specific saved view
 */
export async function GET(request: Request, { params }: RouteParams) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id } = await params

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const [result] = await db
      .select()
      .from(magicfolderSavedViews)
      .where(
        and(
          eq(magicfolderSavedViews.id, id),
          eq(magicfolderSavedViews.tenantId, tenantId),
          or(
            eq(magicfolderSavedViews.userId, auth.userId),
            eq(magicfolderSavedViews.isPublic, true)
          )
        )
      )

    if (!result) throw NotFound("Saved view not found")

    return ok({
      savedView: {
        id: result.id,
        tenantId: result.tenantId,
        userId: result.userId,
        name: result.name,
        description: result.description,
        filters: result.filters as any,
        viewMode: result.viewMode as any,
        sortBy: result.sortBy as any,
        sortOrder: result.sortOrder as any,
        isPublic: result.isPublic,
        isDefault: result.isDefault,
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
 * PUT /api/v1/magicfolder/saved-views/[id]
 * Update a saved view
 */
export async function PUT(request: Request, { params }: RouteParams) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id } = await params

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, UpdateSavedViewSchema)

    // Check ownership
    const [existing] = await db
      .select()
      .from(magicfolderSavedViews)
      .where(
        and(
          eq(magicfolderSavedViews.id, id),
          eq(magicfolderSavedViews.tenantId, tenantId),
          eq(magicfolderSavedViews.userId, auth.userId)
        )
      )

    if (!existing) throw NotFound("Saved view not found")

    // If setting as default, unset previous default
    if (body.isDefault) {
      await db
        .update(magicfolderSavedViews)
        .set({ isDefault: false })
        .where(
          and(
            eq(magicfolderSavedViews.tenantId, tenantId),
            eq(magicfolderSavedViews.userId, auth.userId)
          )
        )
    }

    // Update the saved view
    const [result] = await db
      .update(magicfolderSavedViews)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.filters && { filters: body.filters }),
        ...(body.viewMode && { viewMode: body.viewMode }),
        ...(body.sortBy && { sortBy: body.sortBy }),
        ...(body.sortOrder && { sortOrder: body.sortOrder }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      })
      .where(
        and(
          eq(magicfolderSavedViews.id, id),
          eq(magicfolderSavedViews.tenantId, tenantId),
          eq(magicfolderSavedViews.userId, auth.userId)
        )
      )
      .returning()

    return ok({
      savedView: {
        id: result.id,
        tenantId: result.tenantId,
        userId: result.userId,
        name: result.name,
        description: result.description,
        filters: result.filters as any,
        viewMode: result.viewMode as any,
        sortBy: result.sortBy as any,
        sortOrder: result.sortOrder as any,
        isPublic: result.isPublic,
        isDefault: result.isDefault,
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
 * DELETE /api/v1/magicfolder/saved-views/[id]
 * Delete a saved view
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id } = await params

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    // Check ownership and delete
    const result = await db
      .delete(magicfolderSavedViews)
      .where(
        and(
          eq(magicfolderSavedViews.id, id),
          eq(magicfolderSavedViews.tenantId, tenantId),
          eq(magicfolderSavedViews.userId, auth.userId)
        )
      )

    if ((result as any).rowCount === 0) throw NotFound("Saved view not found")

    return ok({ success: true })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
