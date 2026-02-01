import "@/lib/server/only"
import { parseJson, parseSearchParams } from "@/lib/server/api/validate"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { organizationService } from "@/lib/server/organizations/service"
import { getAuthContext } from "@/lib/server/auth/context"
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationQuerySchema,
  organizationParamsSchema
} from "@/lib/contracts/organizations"
import type { CreateOrganizationInput, UpdateOrganizationInput } from "@/lib/contracts/organizations"

export async function GET(req: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const query = parseSearchParams(new URL(req.url).searchParams, organizationQuerySchema)

    const result = await organizationService.listForUser(auth.userId, query)

    return ok(result)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error listing organizations:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const data = await parseJson(req, createOrganizationSchema)

    const organization = await organizationService.create(data, auth.userId)

    return ok(organization, { status: 201 })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error creating organization:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

