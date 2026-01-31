import { NextResponse } from "next/server"

import { getNeonAuthConfig } from "@/lib/server/auth/neon-integration"

export async function GET() {
  try {
    const config = getNeonAuthConfig()
    
    return NextResponse.json({
      data: {
        neonAuthConfig: {
          enabled: config.enabled,
          projectId: config.projectId,
          dataApiUrl: config.dataApiUrl,
          jwksUrl: config.jwksUrl,
          authBaseUrl: config.authBaseUrl,
          hasJwtSecret: Boolean(config.jwtSecret),
        },
        message: config.enabled 
          ? "Neon Auth is properly configured" 
          : "Neon Auth is not configured - check environment variables",
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
