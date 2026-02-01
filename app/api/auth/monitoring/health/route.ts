/**
 * OAuth Health Check Endpoint
 * GET /api/auth/monitoring/health
 */

import { NextRequest, NextResponse } from "next/server"
import { validateOAuthConfig } from "@/lib/auth/oauth-config"
import { getGlobalTokenMetrics } from "@/lib/auth/token-refresh-monitor"
import { getRateLimitStats } from "@/lib/auth/oauth-rate-limiter"

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
    const configValid = validateOAuthConfig()
    const tokenMetrics = getGlobalTokenMetrics()
    const rateLimitStats = getRateLimitStats()

    const health = {
      status: configValid ? "healthy" : "degraded" as const,
      checks: {
        configuration: configValid ? "✅ Pass" : "❌ Fail",
        oauth: tokenMetrics.totalEvents > 0 ? "✅ Active" : "⏸️ No activity",
        rateLimit: rateLimitStats.totalTrackedClients > 0 ? "✅ Active" : "⏸️ No activity",
      },
      metrics: {
        totalTokenEvents: tokenMetrics.totalEvents,
        tokenSuccessRate: Math.round(tokenMetrics.successRate * 100) / 100,
        tokenFailureRate: Math.round(tokenMetrics.failureRate * 100) / 100,
        uniqueUsers: tokenMetrics.uniqueUsers,
        trackedIPs: rateLimitStats.totalTrackedClients,
        lastHourEvents: tokenMetrics.lastHour.events,
        lastHourFailures: tokenMetrics.lastHour.failures,
      },
      providers: tokenMetrics.providers,
    }

    return NextResponse.json({
      status: "success",
      data: health,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error getting OAuth health:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
