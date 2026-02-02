/**
 * @domain tenancy
 * @layer api
 * @responsibility API route handler for /api/v1/organizations/:id
 */

import "@/lib/server/only"
import { parseJson } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { organizationService } from "@/lib/server/organizations/service"
import { getAuthContext } from "@/lib/server/auth/context"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import {
  updateOrganizationSchema,
  organizationParamsSchema
} from "@/lib/contracts/organizations"
import { requireOrganizationAdmin } from "@/lib/server/permissions/middleware"

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: Context) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = organizationParamsSchema.parse(params)

    // Check if user is member of the organization
    const isMember = await organizationService.isMember(auth.userId, id)
    if (!isMember) {
      return fail({ code: "ACCESS_DENIED", message: "Access denied" }, 403)
    }

    const organization = await organizationService.getById(id)

    return ok(organization)
  })
}

export async function PATCH(req: Request, context: Context) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = organizationParamsSchema.parse(params)
    const data = await parseJson(req, updateOrganizationSchema)

    // Check admin permissions
    await requireOrganizationAdmin()(req)

    const organization = await organizationService.update(id, data)
    invalidateTag(`organizations:${auth.userId}`)

    return ok(organization)
  })
}

export async function DELETE(req: Request, context: Context) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = organizationParamsSchema.parse(params)

    // Check admin permissions
    await requireOrganizationAdmin()(req)

    const organization = await organizationService.delete(id)
    invalidateTag(`organizations:${auth.userId}`)

    return ok(organization)
  })
}

