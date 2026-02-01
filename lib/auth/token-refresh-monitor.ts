/**
 * Token Refresh Monitoring
 * Tracks and monitors OAuth token refresh events for anomaly detection
 */

import { logTokenRefresh, detectTokenRefreshAnomalies } from "@/lib/auth/oauth-config"

interface TokenRefreshMetrics {
  timestamp: string
  userId: string
  provider: "google" | "github" | "neon-auth"
  status: "success" | "failure" | "expired"
  oldExpiresAt?: string
  newExpiresAt?: string
  expiresIn?: number
  errorCode?: string
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}

// In-memory storage for recent token refresh events
// For production, use a database
const tokenRefreshEvents: TokenRefreshMetrics[] = []
const MAX_EVENTS = 10000 // Keep last 10k events

/**
 * Record a token refresh event
 */
export function recordTokenRefresh(metrics: TokenRefreshMetrics) {
  // Add to memory store
  const event: TokenRefreshMetrics = {
    ...metrics,
    timestamp: metrics.timestamp || new Date().toISOString(),
  }
  tokenRefreshEvents.push(event)

  // Keep only recent events
  if (tokenRefreshEvents.length > MAX_EVENTS) {
    tokenRefreshEvents.shift()
  }

  // Log the event
  logTokenRefresh({
    timestamp: metrics.timestamp,
    userId: metrics.userId,
    provider: metrics.provider,
    status: metrics.status,
    oldExpiresAt: metrics.oldExpiresAt,
    newExpiresAt: metrics.newExpiresAt,
    errorMessage: metrics.errorMessage,
    ipAddress: metrics.ipAddress,
    userAgent: metrics.userAgent,
  })

  // Check for anomalies
  const anomalies = detectTokenRefreshAnomalies(
    tokenRefreshEvents.map((e) => ({
      timestamp: e.timestamp,
      userId: e.userId,
      provider: e.provider,
      status: e.status,
      oldExpiresAt: e.oldExpiresAt,
      newExpiresAt: e.newExpiresAt,
      errorMessage: e.errorMessage,
      ipAddress: e.ipAddress,
      userAgent: e.userAgent,
    }))
  )

  if (anomalies.length > 0) {
    anomalies.forEach((anomaly) => console.warn(anomaly))
  }
}

/**
 * Get token refresh metrics for a user
 */
export function getUserTokenMetrics(userId: string) {
  const userEvents = tokenRefreshEvents.filter((e) => e.userId === userId)

  return {
    totalRefreshes: userEvents.length,
    successfulRefreshes: userEvents.filter((e) => e.status === "success").length,
    failedRefreshes: userEvents.filter((e) => e.status === "failure").length,
    expiredTokens: userEvents.filter((e) => e.status === "expired").length,
    byProvider: {
      google: userEvents.filter((e) => e.provider === "google").length,
      github: userEvents.filter((e) => e.provider === "github").length,
      neonAuth: userEvents.filter((e) => e.provider === "neon-auth").length,
    },
    lastRefresh: userEvents[userEvents.length - 1]?.timestamp,
    events: userEvents.slice(-10), // Last 10 events
  }
}

/**
 * Get token refresh metrics for a provider
 */
export function getProviderTokenMetrics(provider: "google" | "github" | "neon-auth") {
  const providerEvents = tokenRefreshEvents.filter((e) => e.provider === provider)

  return {
    totalRefreshes: providerEvents.length,
    successRate:
      providerEvents.length > 0
        ? (providerEvents.filter((e) => e.status === "success").length /
            providerEvents.length) *
          100
        : 0,
    failureRate:
      providerEvents.length > 0
        ? (providerEvents.filter((e) => e.status === "failure").length /
            providerEvents.length) *
          100
        : 0,
    uniqueUsers: new Set(providerEvents.map((e) => e.userId)).size,
    commonErrors: getMostCommonErrors(providerEvents),
    avgRefreshInterval: calculateAvgRefreshInterval(providerEvents),
  }
}

/**
 * Get global token refresh metrics
 */
export function getGlobalTokenMetrics() {
  if (tokenRefreshEvents.length === 0) {
    return {
      totalEvents: 0,
      successRate: 0,
      failureRate: 0,
      uniqueUsers: 0,
      providers: {
        google: {
          count: 0,
          successRate: 0,
        },
        github: {
          count: 0,
          successRate: 0,
        },
        neonAuth: {
          count: 0,
          successRate: 0,
        },
      },
      lastHour: {
        events: 0,
        failures: 0,
      },
    }
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const lastHourEvents = tokenRefreshEvents.filter((e) => e.timestamp > oneHourAgo)

  return {
    totalEvents: tokenRefreshEvents.length,
    successRate:
      (tokenRefreshEvents.filter((e) => e.status === "success").length /
        tokenRefreshEvents.length) *
      100,
    failureRate:
      (tokenRefreshEvents.filter((e) => e.status === "failure").length /
        tokenRefreshEvents.length) *
      100,
    uniqueUsers: new Set(tokenRefreshEvents.map((e) => e.userId)).size,
    providers: {
      google: {
        count: tokenRefreshEvents.filter((e) => e.provider === "google").length,
        successRate:
          (tokenRefreshEvents.filter(
            (e) => e.provider === "google" && e.status === "success"
          ).length /
            (tokenRefreshEvents.filter((e) => e.provider === "google").length ||
              1)) *
          100,
      },
      github: {
        count: tokenRefreshEvents.filter((e) => e.provider === "github").length,
        successRate:
          (tokenRefreshEvents.filter(
            (e) => e.provider === "github" && e.status === "success"
          ).length /
            (tokenRefreshEvents.filter((e) => e.provider === "github").length ||
              1)) *
          100,
      },
      neonAuth: {
        count: tokenRefreshEvents.filter((e) => e.provider === "neon-auth")
          .length,
        successRate:
          (tokenRefreshEvents.filter(
            (e) => e.provider === "neon-auth" && e.status === "success"
          ).length /
            (tokenRefreshEvents.filter((e) => e.provider === "neon-auth")
              .length || 1)) *
          100,
      },
    },
    lastHour: {
      events: lastHourEvents.length,
      failures: lastHourEvents.filter((e) => e.status === "failure").length,
    },
  }
}

/**
 * Get most common refresh errors
 */
function getMostCommonErrors(events: TokenRefreshMetrics[]) {
  const errors: { [key: string]: number } = {}

  events
    .filter((e) => e.status === "failure")
    .forEach((e) => {
      const errorKey = e.errorCode || e.errorMessage || "Unknown"
      errors[errorKey] = (errors[errorKey] || 0) + 1
    })

  return Object.entries(errors)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }))
}

/**
 * Calculate average refresh interval for a user
 */
function calculateAvgRefreshInterval(events: TokenRefreshMetrics[]): number {
  if (events.length < 2) return 0

  const timestamps = events
    .map((e) => new Date(e.timestamp).getTime())
    .sort((a, b) => a - b)

  let totalInterval = 0
  for (let i = 1; i < timestamps.length; i++) {
    totalInterval += timestamps[i] - timestamps[i - 1]
  }

  return Math.round(totalInterval / (timestamps.length - 1) / 1000) // Return in seconds
}

/**
 * Export token refresh events for analysis
 */
export function exportTokenRefreshEvents(filters?: {
  userId?: string
  provider?: "google" | "github" | "neon-auth"
  status?: "success" | "failure" | "expired"
  sinceTimestamp?: string
}) {
  let filtered = tokenRefreshEvents

  if (filters?.userId) {
    filtered = filtered.filter((e) => e.userId === filters.userId)
  }

  if (filters?.provider) {
    filtered = filtered.filter((e) => e.provider === filters.provider)
  }

  if (filters?.status) {
    filtered = filtered.filter((e) => e.status === filters.status)
  }

  if (filters?.sinceTimestamp) {
    filtered = filtered.filter((e) => e.timestamp >= filters.sinceTimestamp!)
  }

  return {
    exportedAt: new Date().toISOString(),
    totalEvents: filtered.length,
    events: filtered,
  }
}

/**
 * Clear old token refresh events (maintenance)
 */
export function clearOldTokenEvents(olderThanHours: number = 24) {
  const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
  const initialCount = tokenRefreshEvents.length

  for (let i = tokenRefreshEvents.length - 1; i >= 0; i--) {
    if (new Date(tokenRefreshEvents[i].timestamp) < cutoffTime) {
      tokenRefreshEvents.splice(i, 1)
    }
  }

  const removedCount = initialCount - tokenRefreshEvents.length
  console.log(
    `🧹 Cleaned up ${removedCount} token refresh events older than ${olderThanHours} hours`
  )

  return removedCount
}
