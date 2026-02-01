/**
 * OAuth Configuration and Monitoring
 * 
 * This module provides:
 * - OAuth scope definitions for Google and GitHub
 * - Callback URL validation
 * - Rate limiting configuration
 * - Token refresh monitoring
 */

// ============================================================================
// OAuth Scopes Configuration
// ============================================================================

/**
 * Google OAuth Scopes
 * These scopes define what data we request from Google
 * 
 * Recommended scopes for typical applications:
 * - openid: Authenticate user identity
 * - email: Get user's email address
 * - profile: Get basic profile info (name, picture, etc.)
 */
export const GOOGLE_OAUTH_SCOPES = [
  "openid",
  "email",
  "profile",
] as const

/**
 * GitHub OAuth Scopes
 * These scopes define what permissions we request from GitHub
 * 
 * Recommended scopes:
 * - read:user: Read basic user profile information
 * - user:email: Access user's email addresses
 */
export const GITHUB_OAUTH_SCOPES = [
  "read:user",
  "user:email",
] as const

// ============================================================================
// Callback URL Configuration
// ============================================================================

/**
 * Get the OAuth callback URLs for the current environment
 */
export function getOAuthCallbackUrls() {
  const isDevelopment = process.env.NODE_ENV === "development"
  const isProduction = process.env.NODE_ENV === "production"

  const baseUrl = isDevelopment
    ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    : process.env.NEXT_PUBLIC_SITE_URL || "https://nexuscanon.com"

  return {
    development: [
      `${baseUrl}/api/auth/callback/google`,
      `${baseUrl}/api/auth/callback/github`,
      "http://localhost:3000/api/auth/callback/google",
      "http://localhost:3000/api/auth/callback/github",
    ],
    production: [
      `${baseUrl}/api/auth/callback/google`,
      `${baseUrl}/api/auth/callback/github`,
    ],
    urls: isDevelopment
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : [baseUrl],
  }
}

/**
 * Validate that the callback URL is properly configured
 */
export function validateCallbackUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)

    // Must be HTTPS in production
    if (
      process.env.NODE_ENV === "production" &&
      parsedUrl.protocol !== "https:"
    ) {
      console.warn(`⚠️ Production OAuth callback must use HTTPS: ${url}`)
      return false
    }

    // Must be HTTP or HTTPS
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      console.error(`❌ Invalid protocol in callback URL: ${url}`)
      return false
    }

    return true
  } catch (error) {
    console.error(`❌ Invalid callback URL: ${url}`, error)
    return false
  }
}

/**
 * Validate OAuth configuration
 */
export function validateOAuthConfig() {
  const missingVars: string[] = []

  if (!process.env.GOOGLE_CLIENT_ID) {
    missingVars.push("GOOGLE_CLIENT_ID")
  }
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    missingVars.push("GOOGLE_CLIENT_SECRET")
  }
  if (!process.env.GITHUB_ID) {
    missingVars.push("GITHUB_ID")
  }
  if (!process.env.GITHUB_SECRET) {
    missingVars.push("GITHUB_SECRET")
  }

  if (missingVars.length > 0) {
    console.error(
      `❌ Missing OAuth environment variables: ${missingVars.join(", ")}`
    )
    return false
  }

  // Validate callback URLs
  const callbacks = getOAuthCallbackUrls()
  const allCallbacks = [
    ...callbacks.development,
    ...callbacks.production,
  ]
  const invalidCallbacks = allCallbacks.filter((url) => !validateCallbackUrl(url))

  if (invalidCallbacks.length > 0) {
    console.warn(
      `⚠️ Invalid callback URLs detected: ${invalidCallbacks.join(", ")}`
    )
  }

  return missingVars.length === 0
}

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

/**
 * Rate limiting configuration for OAuth endpoints
 */
export const OAUTH_RATE_LIMIT_CONFIG = {
  // OAuth token endpoint
  tokenEndpoint: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many OAuth token requests, please try again later",
  },

  // OAuth authorization endpoint
  authEndpoint: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per window
    message: "Too many authorization requests, please try again later",
  },

  // OAuth callback endpoint
  callbackEndpoint: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per window
    message: "Too many callback requests, please try again later",
  },

  // General OAuth endpoint
  oauthEndpoint: {
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 requests per window
    message: "Too many OAuth requests, please try again later",
  },
}

// ============================================================================
// Token Refresh Monitoring
// ============================================================================

/**
 * Token refresh event logger
 */
export interface TokenRefreshEvent {
  timestamp: string
  userId: string
  provider: "google" | "github" | "neon-auth"
  status: "success" | "failure" | "expired"
  oldExpiresAt?: string
  newExpiresAt?: string
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Log token refresh event
 */
export function logTokenRefresh(event: TokenRefreshEvent) {
  const logLevel = event.status === "failure" ? "error" : "info"
  const logPrefix = `[TOKEN_REFRESH]`

  console.log(
    `${logPrefix} [${event.status.toUpperCase()}] User: ${event.userId}, Provider: ${event.provider}, Time: ${event.timestamp}`
  )

  if (event.oldExpiresAt && event.newExpiresAt) {
    console.log(
      `${logPrefix} Token renewed: ${event.oldExpiresAt} → ${event.newExpiresAt}`
    )
  }

  if (event.errorMessage) {
    console[logLevel](
      `${logPrefix} Error: ${event.errorMessage}`
    )
  }

  // Store in database for analytics (optional)
  if (process.env.DATABASE_URL) {
    // Implement database logging if needed
  }
}

/**
 * Monitor token refresh anomalies
 */
export function detectTokenRefreshAnomalies(events: TokenRefreshEvent[]) {
  const anomalies: string[] = []

  // Check for repeated failures
  const failures = events.filter((e) => e.status === "failure")
  if (failures.length > 5) {
    anomalies.push(
      `⚠️ High token refresh failure rate: ${failures.length} failures detected`
    )
  }

  // Check for rapid refreshes (potential attack)
  const rapidRefreshes = events.filter((e) => {
    if (e.newExpiresAt && e.oldExpiresAt) {
      const oldTime = new Date(e.oldExpiresAt).getTime()
      const newTime = new Date(e.newExpiresAt).getTime()
      return newTime - oldTime < 5 * 60 * 1000 // Less than 5 minutes
    }
    return false
  })

  if (rapidRefreshes.length > 3) {
    anomalies.push(
      `⚠️ Unusual rapid token refresh pattern detected: ${rapidRefreshes.length} rapid refreshes`
    )
  }

  // Check for expired tokens not being refreshed
  const expiredWithoutRefresh = events.filter(
    (e) => e.status === "expired" && !e.newExpiresAt
  )
  if (expiredWithoutRefresh.length > 2) {
    anomalies.push(
      `⚠️ Tokens expiring without refresh: ${expiredWithoutRefresh.length} cases`
    )
  }

  return anomalies
}

// ============================================================================
// OAuth Provider Configuration
// ============================================================================

/**
 * Supported OAuth providers with their details
 */
export const OAUTH_PROVIDERS = {
  google: {
    name: "Google",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://www.googleapis.com/oauth2/v1/userinfo",
    scopes: GOOGLE_OAUTH_SCOPES,
    scopeDelimiter: " ",
  },
  github: {
    name: "GitHub",
    clientIdEnv: "GITHUB_ID",
    clientSecretEnv: "GITHUB_SECRET",
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    userInfoUrl: "https://api.github.com/user",
    scopes: GITHUB_OAUTH_SCOPES,
    scopeDelimiter: " ",
  },
} as const

export type OAuthProviderType = keyof typeof OAUTH_PROVIDERS

// ============================================================================
// OAuth Configuration Summary
// ============================================================================

/**
 * Get OAuth configuration summary for logging/debugging
 */
export function getOAuthConfigSummary() {
  const isValid = validateOAuthConfig()
  const callbacks = getOAuthCallbackUrls()

  return {
    status: isValid ? "✅ Valid" : "❌ Invalid",
    environment: process.env.NODE_ENV,
    providers: {
      google: {
        configured: !!process.env.GOOGLE_CLIENT_ID,
        scopes: GOOGLE_OAUTH_SCOPES,
      },
      github: {
        configured: !!process.env.GITHUB_ID,
        scopes: GITHUB_OAUTH_SCOPES,
      },
    },
    callbackUrls: callbacks.urls,
    rateLimiting: OAUTH_RATE_LIMIT_CONFIG,
  }
}