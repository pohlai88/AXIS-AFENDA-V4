import { NextResponse } from "next/server"

import { getNeonAuthConfig } from "@/lib/server/auth/neon-integration"

export async function GET() {
  try {
    // Avoid leaking environment configuration in production.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ data: null, error: "Not found" }, { status: 404 })
    }

    const config = getNeonAuthConfig()
    
    return NextResponse.json({
      data: {
        neonAuthConfig: {
          enabled: config.enabled,
          projectId: config.projectId,
          dataApiUrl: config.dataApiUrl,
          jwksUrl: config.jwksUrl,
          authBaseUrl: config.authBaseUrl,
          hasJwtVerificationSecret: Boolean(config.jwtVerificationSecret),
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
