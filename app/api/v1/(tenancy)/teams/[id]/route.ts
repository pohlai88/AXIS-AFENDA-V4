import "@/lib/server/only"
import { parseJson } from "@/lib/server/api/validate"
import { ok, fail } from "@/lib/server/api/response"
import { HttpError } from "@/lib/server/api/errors"
import { teamService } from "@/lib/server/teams/service"
import { getAuthContext } from "@/lib/server/auth/context"
import {
  updateTeamSchema,
  teamParamsSchema
} from "@/lib/contracts/organizations"
import type { UpdateTeamInput } from "@/lib/contracts/organizations"
import { requireTeamManager } from "@/lib/server/permissions/middleware"

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: Context) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = teamParamsSchema.parse(params)

    // Check if user is member of the team
    const isMember = await teamService.isMember(auth.userId, id)
    if (!isMember) {
      return fail({ code: "ACCESS_DENIED", message: "Access denied" }, 403)
    }

    const team = await teamService.getById(id)

    return ok(team)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error getting team:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

export async function PATCH(req: Request, context: Context) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = teamParamsSchema.parse(params)
    const data = await parseJson(req, updateTeamSchema)

    // Check manager permissions
    await requireTeamManager()(req)

    const team = await teamService.update(id, data)

    return ok(team)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error updating team:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

export async function DELETE(req: Request, context: Context) {
  try {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = teamParamsSchema.parse(params)

    // Check manager permissions
    await requireTeamManager()(req)

    const team = await teamService.delete(id)

    return ok(team)
  } catch (error) {
    if (error instanceof HttpError) {
      return fail({ code: error.code, message: error.message }, error.status)
    }
    console.error("Error deleting team:", error)
    return fail({ code: "INTERNAL_ERROR", message: "Internal server error" }, 500)
  }
}

