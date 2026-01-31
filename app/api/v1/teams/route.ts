import "@/lib/server/only"
import { parseJson, parseSearchParams } from "@/lib/server/api/validate"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { teamService } from "@/lib/server/teams/service"
import { getAuthContext } from "@/lib/server/auth/context"
import {
  createTeamSchema,
  teamQuerySchema
} from "@/lib/contracts/organizations"
import type { CreateTeamInput } from "@/lib/contracts/organizations"

export async function GET(req: Request) {
  try {
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
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error listing teams:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const data = await parseJson(req, createTeamSchema)

    const team = await teamService.create(data, auth.userId)

    return ok(team, { status: 201 })
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error creating team:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}
