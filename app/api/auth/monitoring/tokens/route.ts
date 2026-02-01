/**
 * Token Refresh Metrics Endpoint
 * GET /api/auth/monitoring/tokens
 */

import { NextRequest, NextResponse } from "next/server"
import { getGlobalTokenMetrics, getUserTokenMetrics, getProviderTokenMetrics } from "@/lib/auth/token-refresh-monitor"

export async function GET(request: NextRequest) {
  // Check if request is from localhost
  const host = request.headers.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

  if (!isLocalhost && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized - only available in development" },
      { status: 401 }
    )
  }

  try {
    const searchParams = new URL(request.url).searchParams
    const userId = searchParams.get("userId")
    const provider = searchParams.get("provider") as any

    let metrics

    if (userId) {
      metrics = getUserTokenMetrics(userId)
    } else if (provider && ["google", "github", "neon-auth"].includes(provider)) {
      metrics = getProviderTokenMetrics(provider)
    } else {
      metrics = getGlobalTokenMetrics()
    }

    return NextResponse.json({
      status: "success",
      data: metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting token metrics:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
