import { NextResponse } from "next/server"

import { UserDataService } from "@/lib/server/services/user-data-service"

export async function GET() {
  try {
    const result = await UserDataService.getUserProfile()

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
