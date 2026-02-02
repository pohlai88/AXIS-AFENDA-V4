/**
 * @domain orchestra
 * @layer api
 * @responsibility API route handler for /api/debug/neon-auth
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"

import { getAuthContext } from "@/lib/server/auth/context"
import { createNeonDataApiClient } from "@/lib/server/neon/data-api"
import { fail, ok } from "@/lib/server/api/response"

// Route Segment Config: Debug routes should never cache
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Debug endpoint only; don't expose in production.
    if (process.env.NODE_ENV === "production") {
      return fail({ code: "NOT_FOUND", message: "Not found" }, 404)
    }

    const authContext = await getAuthContext()

    if (!authContext.userId) {
      return fail({ code: "UNAUTHORIZED", message: "Unauthorized" }, 401)
    }

    // Call Neon Data API as the authenticated user (JWT bearer token).
    const neonClient = createNeonDataApiClient(authContext.sessionId)

    // Try to get users from the public schema
    const usersResponse = await neonClient.get("public.users", {
      select: "id, email, role, created_at",
      limit: 10,
    })

    if (usersResponse.error) {
      return fail(
        {
          code: "NEON_API_ERROR",
          message: `Neon API Error: ${usersResponse.error}`,
          details: { authSource: authContext.authSource },
        },
        500
      )
    }

    return ok({
      users: usersResponse.data,
      authSource: authContext.authSource,
      message: "Successfully retrieved data via Neon Auth integration",
    })
  } catch (error) {
    return fail(
      {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Debug endpoint only; don't expose in production.
    if (process.env.NODE_ENV === "production") {
      return fail({ code: "NOT_FOUND", message: "Not found" }, 404)
    }

    const authContext = await getAuthContext()

    if (!authContext.userId) {
      return fail({ code: "UNAUTHORIZED", message: "Unauthorized" }, 401)
    }

    const body = await request.json()
    const neonClient = createNeonDataApiClient(authContext.sessionId)

    // Example: Create a new user (if you have the right permissions)
    const createResponse = await neonClient.post("public.users", {
      email: body.email,
      role: body.role || "user",
      // Add other required fields based on your schema
    })

    if (createResponse.error) {
      return fail(
        {
          code: "NEON_API_ERROR",
          message: `Create Error: ${createResponse.error}`,
        },
        500
      )
    }

    return ok({
      created: createResponse.data,
      authSource: authContext.authSource,
      message: "Successfully created record via Neon Auth integration",
    })
  } catch (error) {
    return fail(
      {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    )
  }
}

