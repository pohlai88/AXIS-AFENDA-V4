/**
 * @domain orchestra
 * @layer api
 * @responsibility API route handler for /api/debug/neon-config
 */

import "@/lib/server/only"

import { getNeonAuthConfig } from "@/lib/server/auth/neon-integration"
import { fail, ok } from "@/lib/server/api/response"

// Route Segment Config: Debug routes should never cache
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Avoid leaking environment configuration in production.
    if (process.env.NODE_ENV === "production") {
      return fail({ code: "NOT_FOUND", message: "Not found" }, 404)
    }

    const config = getNeonAuthConfig()

    return ok({
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

