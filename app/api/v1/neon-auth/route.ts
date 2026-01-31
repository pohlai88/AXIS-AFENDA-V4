import { NextRequest, NextResponse } from "next/server"

import { getAuthContext } from "@/lib/server/auth/context"
import { createNeonDataApiClient } from "@/lib/server/neon/data-api"

export async function GET() {
  try {
    const authContext = await getAuthContext()

    if (!authContext.userId) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Example: Get users from Neon Data API
    const neonClient = createNeonDataApiClient(authContext.userId)

    // Try to get users from the public schema
    const usersResponse = await neonClient.get("public.users", {
      select: "id, email, role, created_at",
      limit: 10,
    })

    if (usersResponse.error) {
      return NextResponse.json(
        {
          data: null,
          error: `Neon API Error: ${usersResponse.error}`,
          authContext,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        users: usersResponse.data,
        authSource: authContext.authSource,
        message: "Successfully retrieved data via Neon Auth integration",
      },
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext()

    if (!authContext.userId) {
      return NextResponse.json(
        { data: null, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const neonClient = createNeonDataApiClient(authContext.userId)

    // Example: Create a new user (if you have the right permissions)
    const createResponse = await neonClient.post("public.users", {
      email: body.email,
      role: body.role || "user",
      // Add other required fields based on your schema
    })

    if (createResponse.error) {
      return NextResponse.json(
        {
          data: null,
          error: `Create Error: ${createResponse.error}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        created: createResponse.data,
        authSource: authContext.authSource,
        message: "Successfully created record via Neon Auth integration",
      },
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
