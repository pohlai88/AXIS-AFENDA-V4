import { NextRequest, NextResponse } from "next/server"

import { UserDataService } from "@/lib/server/services/user-data-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined

    const result = await UserDataService.getUserTodos({
      limit,
      offset,
    })

    return NextResponse.json({
      data: result,
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 401 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const result = await UserDataService.createUserTodo({
      title: body.title,
      description: body.description,
      due_at: body.due_at,
    })

    return NextResponse.json({
      data: result,
      error: null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 401 }
    )
  }
}
