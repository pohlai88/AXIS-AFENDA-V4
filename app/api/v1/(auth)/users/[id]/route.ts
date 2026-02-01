import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, NotFound } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getUserById } from "@/lib/server/db/queries-edge/user.queries"

export const runtime = "edge"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const { id } = await ctx.params
    const user = await getUserById(id)
    if (!user) throw NotFound("User not found")
    return ok(user)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

