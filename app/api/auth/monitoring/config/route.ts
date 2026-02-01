/**
 * OAuth Configuration Monitoring Endpoint
 * GET /api/auth/monitoring/config
 */

import { NextRequest, NextResponse } from "next/server"
import { getOAuthConfigSummary, validateOAuthConfig } from "@/lib/auth/oauth-config"

export async function GET(request: NextRequest) {
  // Check if request is from localhost or development
  const host = request.headers.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

  if (!isLocalhost && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized - only available in development" },
      { status: 401 }
    )
  }

  try {
    const config = getOAuthConfigSummary()
    const isValid = validateOAuthConfig()

    return NextResponse.json({
      status: "success",
      data: {
        ...config,
        validated: isValid,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error getting OAuth config:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
