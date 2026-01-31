import "@/lib/server/only"
import { parseJson } from "@/lib/server/api/validate"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { organizationService } from "@/lib/server/organizations/service"
import { getAuthContext } from "@/lib/server/auth/context"
import {
  updateOrganizationSchema,
  organizationParamsSchema
} from "@/lib/contracts/organizations"
import type { UpdateOrganizationInput } from "@/lib/contracts/organizations"
import { requireOrganizationAdmin } from "@/lib/server/permissions/middleware"

interface Context {
  params: { id: string }
}

export async function GET(req: Request, context: Context) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const { id } = organizationParamsSchema.parse(context.params)

    // Check if user is member of the organization
    const isMember = await organizationService.isMember(auth.userId, id)
    if (!isMember) {
      return fail({ code: "ACCESS_DENIED", message: "Access denied" }, 403)
    }

    const organization = await organizationService.getById(id)

    return ok(organization)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error getting organization:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

export async function PATCH(req: Request, context: Context) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const { id } = organizationParamsSchema.parse(context.params)
    const data = await parseJson(req, updateOrganizationSchema)

    // Check admin permissions
    await requireOrganizationAdmin()(req)

    const organization = await organizationService.update(id, data)

    return ok(organization)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error updating organization:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

export async function DELETE(req: Request, context: Context) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const { id } = organizationParamsSchema.parse(context.params)

    // Check admin permissions
    await requireOrganizationAdmin()(req)

    const organization = await organizationService.delete(id)

    return ok(organization)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error deleting organization:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}
