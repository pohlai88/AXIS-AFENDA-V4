/**
 * @domain tenancy
 * @layer api
 * @responsibility API route handler for /api/v1/teams
 */

import "@/lib/server/only"
import { parseJson, parseSearchParams } from "@/lib/server/api/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { ok } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { teamService } from "@/lib/server/teams/service"
import { getAuthContext } from "@/lib/server/auth/context"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import {
  createTeamSchema,
  teamQuerySchema
} from "@/lib/contracts/organizations"

export async function GET(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const query = parseSearchParams(new URL(req.url).searchParams, teamQuerySchema)

    // Check if querying by organization
    const organizationId = new URL(req.url).searchParams.get("organizationId")

    let result

    if (organizationId) {
      result = await teamService.listForOrganization(organizationId, auth.userId, query)
    } else {
      result = await teamService.listForUser(auth.userId, query)
    }

    return ok(result)
  })
}

export async function POST(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const data = await parseJson(req, createTeamSchema)

    const team = await teamService.create(data, auth.userId)
    invalidateTag(`teams:${auth.userId}`)

    return ok(team, { status: 201 })
  })
}

