/**
 * @domain auth
 * @layer api
 * @responsibility API route handler for /api/v1/users/:id
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { userIdParamSchema } from "@/lib/contracts/sessions"
import { HttpError, NotFound } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const rawParams = await ctx.params
    const { id } = userIdParamSchema.parse(rawParams)

    const authContext = await getAuthContext()
    if (!authContext.isAuthenticated || !authContext.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    // Enterprise policy (Neon-only): users API is self-only unless elevated role.
    const isSelf = id === authContext.userId
    const isAdmin = authContext.roles.includes("admin")
    if (!isSelf && !isAdmin) {
      throw new HttpError(403, "FORBIDDEN", "Not allowed to access other users")
    }

    // Edge-safe: do not call Neon Auth server SDK here.
    // For self requests, return identity fields from our auth context.
    if (isSelf) {
      return ok({
        id: authContext.userId,
        email: authContext.email ?? null,
        roles: authContext.roles,
      })
    }

    // For admin requests, we currently do not expose a full directory listing.
    // Keep the endpoint stable but minimal until an admin-backed Neon Auth query is added.
    if (!isSelf && isAdmin) {
      return ok({ id, roles: [] as string[] })
    }

    throw NotFound("User not found")
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}

