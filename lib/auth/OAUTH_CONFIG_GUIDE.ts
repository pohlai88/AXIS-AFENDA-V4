/**
 * OAuth Configuration Documentation
 * 
 * This file documents the OAuth setup and requirements for your application
 */

// ============================================================================
// OAUTH CALLBACK URLS CONFIGURATION
// ============================================================================

/**
 * IMPORTANT: You must configure these callback URLs in your OAuth provider settings
 * 
 * For Google OAuth:
 * 1. Go to: https://console.cloud.google.com/apis/credentials
 * 2. Find your OAuth 2.0 Client ID
 * 3. Add these Authorized redirect URIs:
 *    - http://localhost:3000/api/auth/callback/google (development)
 *    - https://nexuscanon.com/api/auth/callback/google (production)
 * 
 * For GitHub OAuth:
 * 1. Go to: https://github.com/settings/developers
 * 2. Find your OAuth App
 * 3. Set Authorization callback URL to:
 *    - http://localhost:3000/api/auth/callback/github (development)
 *    - https://nexuscanon.com/api/auth/callback/github (production)
 */

// ============================================================================
// OAUTH SCOPES EXPLANATION
// ============================================================================

/**
 * GOOGLE OAUTH SCOPES:
 * 
 * openid
 *   - Authenticate user identity
 *   - Required for authentication
 * 
 * email
 *   - Access user's email address
 *   - Used for account matching and notifications
 * 
 * profile
 *   - Basic profile information (name, picture, locale, etc.)
 *   - Used for user profile display
 * 
 * Optional scopes (if needed):
 *   - calendar: https://www.googleapis.com/auth/calendar
 *   - drive: https://www.googleapis.com/auth/drive
 *   - youtube: https://www.googleapis.com/auth/youtube
 */

/**
 * GITHUB OAUTH SCOPES:
 * 
 * read:user
 *   - Read access to user profile information
 *   - Includes: profile, email, name, etc.
 * 
 * user:email
 *   - Read access to user email addresses
 *   - Required for email-based notifications
 * 
 * Optional scopes (if needed):
 *   - repo: Full access to repositories
 *   - gist: Full access to gists
 *   - workflow: Full access to GitHub Actions workflows
 */

// ============================================================================
// RATE LIMITING CONFIGURATION
// ============================================================================

/**
 * Rate Limits Applied:
 * 
 * Token Endpoint:
 *   - 100 requests per 15 minutes
 *   - Prevents brute force attacks on token refresh
 * 
 * Authorization Endpoint:
 *   - 30 requests per 1 minute
 *   - Prevents login abuse
 * 
 * Callback Endpoint:
 *   - 200 requests per 15 minutes
 *   - Allows for legitimate OAuth flows
 * 
 * General OAuth Endpoint:
 *   - 50 requests per 1 minute
 *   - Protects OAuth endpoints
 * 
 * Response Headers:
 *   - X-RateLimit-Limit: Maximum requests allowed
 *   - X-RateLimit-Remaining: Requests remaining
 *   - X-RateLimit-Reset: Unix timestamp when limit resets
 *   - Retry-After: Seconds to wait before retrying (on 429)
 */

// ============================================================================
// TOKEN REFRESH MONITORING
// ============================================================================

/**
 * Token Refresh Events Tracked:
 * 
 * 1. Success
 *    - Token refreshed successfully
 *    - Both old and new expiration times recorded
 * 
 * 2. Failure
 *    - Token refresh failed (network, invalid credentials, etc.)
 *    - Error code and message recorded
 * 
 * 3. Expired
 *    - Token expired before refresh could occur
 *    - Indicates potential session management issues
 * 
 * Anomaly Detection:
 * - High failure rates (>5 failures)
 * - Rapid refresh patterns (<5 minutes apart)
 * - Expired tokens not being refreshed
 * 
 * Metrics Available:
 * - Per-user: Total refreshes, success rate, provider breakdown
 * - Per-provider: Success rate, unique users, common errors
 * - Global: Overall health, hourly stats, provider comparison
 */

// ============================================================================
// ENVIRONMENT VARIABLES REQUIRED
// ============================================================================

/**
 * OAuth Credentials (Required):
 * 
 * GOOGLE_CLIENT_ID
 *   - From Google Cloud Console
 *   - Format: {project-id}.apps.googleusercontent.com
 * 
 * GOOGLE_CLIENT_SECRET
 *   - From Google Cloud Console
 *   - Keep secret, never commit to repository
 * 
 * GITHUB_ID
 *   - From GitHub Settings > Developer settings > OAuth Apps
 *   - Also called "Client ID"
 * 
 * GITHUB_SECRET
 *   - From GitHub Settings > Developer settings > OAuth Apps
 *   - Keep secret, never commit to repository
 */

/**
 * Neon Auth URLs (Required):
 * 
 * NEON_AUTH_BASE_URL
 *   - Base URL for Neon Auth API
 *   - Format: https://{endpoint}.neonauth.{region}.aws.neon.tech/neondb/auth
 * 
 * NEXT_PUBLIC_NEON_AUTH_URL
 *   - Public URL for client-side auth
 *   - Same as NEON_AUTH_BASE_URL (safe for client)
 * 
 * NEON_AUTH_COOKIE_SECRET
 *   - Secret for signing auth cookies
 *   - Generate: openssl rand -base64 32
 */

/**
 * Callback URLs (Required):
 * 
 * NEXT_PUBLIC_APP_URL
 *   - Development: http://localhost:3000
 *   - Production: https://nexuscanon.com
 * 
 * NEXT_PUBLIC_SITE_URL
 *   - Production domain for OAuth callbacks
 *   - Used when NEXT_PUBLIC_APP_URL is not localhost
 */

// ============================================================================
// TESTING OAUTH LOCALLY
// ============================================================================

/**
 * Testing Email/Password Authentication:
 * 
 * 1. Start dev server: pnpm dev
 * 2. Go to: http://localhost:3000/register
 * 3. Create account with test email
 * 4. Verify via OTP
 * 5. Login to test session flow
 */

/**
 * Testing Google OAuth:
 * 
 * 1. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set
 * 2. Google Console must have localhost callback configured:
 *    - http://localhost:3000/api/auth/callback/google
 * 3. Click "Sign in with Google" button
 * 4. Check browser console for errors
 * 5. Verify session in browser DevTools > Application > Cookies
 */

/**
 * Testing GitHub OAuth:
 * 
 * 1. Ensure GITHUB_ID and GITHUB_SECRET are set
 * 2. GitHub OAuth app must have callback configured:
 *    - http://localhost:3000/api/auth/callback/github
 * 3. Click "Sign in with GitHub" button
 * 4. Check browser console for errors
 * 5. Verify session in browser DevTools > Application > Cookies
 */

// ============================================================================
// DEBUGGING OAUTH ISSUES
// ============================================================================

/**
 * Common Issues and Solutions:
 * 
 * 1. "Invalid callback URL"
 *    - Solution: Ensure callback URL is registered in OAuth provider settings
 *    - Google: https://console.cloud.google.com/apis/credentials
 *    - GitHub: https://github.com/settings/developers
 * 
 * 2. "Invalid client ID"
 *    - Solution: Verify CLIENT_ID and CLIENT_SECRET in .env
 *    - Check for typos or extra whitespace
 * 
 * 3. "Session not persisting"
 *    - Solution: Check NEON_AUTH_COOKIE_SECRET is set
 *    - Verify database connection and neon_auth schema
 * 
 * 4. "Token refresh failing"
 *    - Solution: Check token refresh monitoring logs
 *    - Verify provider credentials haven't been revoked
 *    - Check rate limiting isn't blocking legitimate requests
 * 
 * 5. "CORS errors"
 *    - Solution: Verify NEON_AUTH_BASE_URL is correct
 *    - Check trusted origins in database configuration
 *    - Ensure client-side requests use correct base URL
 */

// ============================================================================
// PRODUCTION CHECKLIST
// ============================================================================

/**
 * Before deploying to production:
 * 
 * ✅ OAuth Credentials
 *    - [ ] Generate production OAuth credentials with OAuth providers
 *    - [ ] Update CLIENT_ID and CLIENT_SECRET in production env
 * 
 * ✅ Callback URLs
 *    - [ ] Register https://nexuscanon.com/api/auth/callback/google
 *    - [ ] Register https://nexuscanon.com/api/auth/callback/github
 *    - [ ] Remove localhost callbacks from production settings
 * 
 * ✅ SSL/TLS
 *    - [ ] All OAuth callback URLs use HTTPS
 *    - [ ] Database connection uses SSL
 *    - [ ] Neon Auth endpoints accessible via HTTPS
 * 
 * ✅ Rate Limiting
 *    - [ ] Rate limiting configured and tested
 *    - [ ] Monitor for legitimate users being blocked
 * 
 * ✅ Token Monitoring
 *    - [ ] Token refresh monitoring active
 *    - [ ] Error alerts configured
 *    - [ ] Anomaly detection alerts configured
 * 
 * ✅ Security
 *    - [ ] NEON_AUTH_COOKIE_SECRET is unique and strong
 *    - [ ] OAuth secrets not exposed in logs
 *    - [ ] Database backups include auth data
 * 
 * ✅ Testing
 *    - [ ] Test Google OAuth flow end-to-end
 *    - [ ] Test GitHub OAuth flow end-to-end
 *    - [ ] Test session persistence across requests
 *    - [ ] Test logout and session cleanup
 */

export const OAUTH_CONFIG_DOCS = {
  lastUpdated: "2026-02-01",
  version: "1.0.0",
  reviewed: false,
}