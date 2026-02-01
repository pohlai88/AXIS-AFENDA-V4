/**
 * OAuth Monitoring API Endpoints
 * 
 * Provides endpoints for monitoring OAuth configuration and token refresh metrics
 */

import { NextRequest, NextResponse } from "next/server"
import { getOAuthConfigSummary, validateOAuthConfig } from "@/lib/auth/oauth-config"
import { getGlobalTokenMetrics, getUserTokenMetrics, getProviderTokenMetrics } from "@/lib/auth/token-refresh-monitor"
import { getRateLimitStats } from "@/lib/auth/oauth-rate-limiter"

/**
 * GET /api/auth/monitoring/config
 * Returns OAuth configuration summary
 */
export async function getOAuthConfig(request: NextRequest) {
  // Check if request is from localhost or authorized
  const host = request.headers.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

  if (!isLocalhost && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized" },
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
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/monitoring/tokens
 * Returns token refresh metrics
 */
export async function getTokenMetrics(request: NextRequest) {
  // Check if request is from localhost
  const host = request.headers.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

  if (!isLocalhost && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized" },
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
    } else if (provider) {
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
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/monitoring/rate-limit
 * Returns rate limiting statistics
 */
export async function getRateLimitMetrics(request: NextRequest) {
  // Check if request is from localhost
  const host = request.headers.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

  if (!isLocalhost && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const stats = getRateLimitStats()

    return NextResponse.json({
      status: "success",
      data: stats,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/monitoring/health
 * Returns overall OAuth system health
 */
export async function getOAuthHealth(request: NextRequest) {
  // Check if request is from localhost
  const host = request.headers.get("host") || ""
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1")

  if (!isLocalhost && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Unauthorized" },
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
        tokenSuccessRate: tokenMetrics.successRate,
        tokenFailureRate: tokenMetrics.failureRate,
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
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}