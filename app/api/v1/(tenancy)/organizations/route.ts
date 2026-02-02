/**
 * @domain tenancy
 * @layer api
 * @responsibility API route handler for /api/v1/organizations
 */

import "@/lib/server/only"
import { parseJson, parseSearchParams } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { ok } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { organizationService } from "@/lib/server/organizations/service"
import { getAuthContext } from "@/lib/server/auth/context"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import {
  createOrganizationSchema,
  organizationQuerySchema
} from "@/lib/contracts/organizations"

export async function GET(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const query = parseSearchParams(new URL(req.url).searchParams, organizationQuerySchema)

    const result = await organizationService.listForUser(auth.userId, query)

    return ok(result)
  })
}

export async function POST(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const data = await parseJson(req, createOrganizationSchema)

    const organization = await organizationService.create(data, auth.userId)
    invalidateTag(`organizations:${auth.userId}`)

    return ok(organization, { status: 201 })
  })
}

