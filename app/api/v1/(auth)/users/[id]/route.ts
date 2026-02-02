/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/v1/users/:id
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { userIdParamSchema } from "@/lib/contracts/sessions"
import { HttpError, NotFound, BadRequest } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getUserById } from "@/lib/server/db/queries-edge/user.queries"

export const runtime = "edge"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const rawParams = await ctx.params
    const { id } = userIdParamSchema.parse(rawParams)
    const user = await getUserById(id)
    if (!user) throw NotFound("User not found")
    return ok(user)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

