/**
 * @domain magicfolder
 * @layer api
 * @responsibility API routes for MagicFolder saved views
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import {
  SavedViewListQuerySchema,
  CreateSavedViewSchema
} from "@/lib/contracts/magicfolder-saved-views"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { db } from "@/lib/server/db"
import { magicfolderSavedViews } from "@/lib/server/db/schema"
import { eq, and, desc, asc, ilike, or, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

/**
 * GET /api/v1/magicfolder/saved-views
 * List saved views for the current user (including public views in tenant)
 */
export async function GET(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const url = new URL(request.url)
    const query = SavedViewListQuerySchema.parse(Object.fromEntries(url.searchParams))

    // Build where clause
    const whereConditions = [
      eq(magicfolderSavedViews.tenantId, tenantId),
      or(
        eq(magicfolderSavedViews.userId, auth.userId),
        eq(magicfolderSavedViews.isPublic, true)
      )
    ]

    // Add search filter
    const searchTerm = query.search?.trim()
    if (searchTerm) {
      const escaped = searchTerm.replace(/%/g, "\\%").replace(/_/g, "\\_")
      whereConditions.push(
        or(
          ilike(magicfolderSavedViews.name, `%${escaped}%`),
          ilike(magicfolderSavedViews.description, `%${escaped}%`)
        )
      )
    }

    // Add view mode filter
    if (query.viewMode) {
      whereConditions.push(eq(magicfolderSavedViews.viewMode, query.viewMode))
    }

    // Add public filter
    if (query.isPublic !== undefined) {
      whereConditions.push(eq(magicfolderSavedViews.isPublic, query.isPublic))
    }

    const where = and(...whereConditions)

    // Execute query
    const [items, totalResult] = await Promise.all([
      db
        .select()
        .from(magicfolderSavedViews)
        .where(where)
        .orderBy(desc(magicfolderSavedViews.createdAt))
        .limit(query.limit)
        .offset(query.offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(magicfolderSavedViews)
        .where(where)
        .limit(1)
    ])

    const total = totalResult[0]?.count ?? 0

    return ok({
      items: items.map(item => ({
        id: item.id,
        tenantId: item.tenantId,
        userId: item.userId,
        name: item.name,
        description: item.description,
        filters: item.filters as any,
        viewMode: item.viewMode as any,
        sortBy: item.sortBy as any,
        sortOrder: item.sortOrder as any,
        isPublic: item.isPublic,
        isDefault: item.isDefault,
        createdAt: (item.createdAt ?? new Date()).toISOString(),
        updatedAt: (item.updatedAt ?? new Date()).toISOString(),
      })),
      total,
      limit: query.limit,
      offset: query.offset,
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

/**
 * POST /api/v1/magicfolder/saved-views
 * Create a new saved view
 */
export async function POST(request: Request) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, CreateSavedViewSchema)

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

    // Create new saved view
    const [result] = await db
      .insert(magicfolderSavedViews)
      .values({
        tenantId,
        userId: auth.userId,
        name: body.name,
        description: body.description,
        filters: body.filters,
        viewMode: body.viewMode,
        sortBy: body.sortBy,
        sortOrder: body.sortOrder,
        isPublic: body.isPublic,
        isDefault: body.isDefault,
      })
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
