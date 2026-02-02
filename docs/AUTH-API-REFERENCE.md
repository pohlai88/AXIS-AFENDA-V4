# Authentication API Reference

## Token Refresh API

### Endpoint: POST /api/auth/refresh

**Purpose:** Check and proactively refresh authentication token before expiration.

**Authentication:** Required (Neon Auth session cookie)

**Request:**
```http
POST /api/auth/refresh HTTP/1.1
Content-Type: application/json
Cookie: [neon auth cookie]
```

**Response (200 OK):**
```json
{
  "refreshed": true,
  "expiresAt": "2026-02-03T10:45:00.000Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Not authenticated"
}
```

**Response (500 Server Error):**
```json
{
  "error": "Token refresh failed",
  "message": "Unable to refresh session"
}
```

**Headers (Response):**
```
X-Token-Refreshed: true
X-Token-Expires-At: 2026-02-03T10:45:00.000Z
```

**Client-Side Usage:**
```typescript
// Manual refresh
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
})

const data = await response.json()
console.log('Token refreshed:', data.refreshed)
```

**React Hook Usage:**
```tsx
import { useTokenRefresh } from '@/hooks/use-token-refresh'

export function MyComponent() {
  const { refreshNow } = useTokenRefresh({
    checkIntervalMs: 60 * 1000, // Check every minute
  })

  return (
    <button onClick={refreshNow}>
      Refresh Now
    </button>
  )
}
```

**Behavior:**
- Automatically invoked every 60 seconds by `useTokenRefresh()` hook
- Returns `refreshed: false` if token is still valid (> 10 minutes remaining)
- Returns `refreshed: true` if token was successfully refreshed
- Failure does not invalidate current session

---

## Session Management API

### Endpoint: GET /api/auth/sessions

**Purpose:** Retrieve list of all active sessions for authenticated user.

**Authentication:** Required (Neon Auth session cookie)

**Request:**
```http
GET /api/auth/sessions HTTP/1.1
Cookie: [neon auth cookie]
```

**Response (200 OK):**
```json
{
  "success": true,
  "sessions": [
    {
      "id": "sess_abc123xyz",
      "device": "Desktop",
      "browser": "Chrome",
      "os": "Windows 10/11",
      "ipAddress": "192.168.1.100",
      "lastActive": "2026-02-02T14:30:00.000Z",
      "expires": "2026-02-03T14:30:00.000Z",
      "createdAt": "2026-02-01T14:30:00.000Z",
      "isCurrent": true
    },
    {
      "id": "sess_def456uvw",
      "device": "Mobile",
      "browser": "Safari",
      "os": "iOS",
      "ipAddress": "203.0.113.45",
      "lastActive": "2026-02-02T10:15:00.000Z",
      "expires": "2026-02-03T10:15:00.000Z",
      "createdAt": "2026-02-01T10:15:00.000Z",
      "isCurrent": false
    }
  ]
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized - user not authenticated",
  "sessions": []
}
```

**Response (500 Server Error):**
```json
{
  "success": false,
  "error": "Failed to retrieve sessions",
  "sessions": []
}
```

**Query Parameters:** None

**Client-Side Usage:**
```typescript
const response = await fetch('/api/auth/sessions')
const data = await response.json()

if (data.success) {
  data.sessions.forEach(session => {
    console.log(`${session.browser} on ${session.os} (${session.device})`)
  })
}
```

**Session Object Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique session identifier |
| `device` | string | Device type: "Desktop", "Mobile", "Tablet" |
| `browser` | string | Browser name: "Chrome", "Firefox", "Safari", "Edge", etc. |
| `os` | string | Operating system: "Windows 10/11", "macOS", "Linux", "iOS", "Android" |
| `ipAddress` | string \| null | IP address of session origin |
| `lastActive` | string | ISO timestamp of last activity |
| `expires` | string | ISO timestamp of session expiration |
| `createdAt` | string | ISO timestamp of session creation |
| `isCurrent` | boolean | Whether this is the current session |

---

### Endpoint: POST /api/auth/sessions

**Purpose:** Manage user sessions (revoke specific or all others).

**Authentication:** Required (Neon Auth session cookie)

**Base URL:** `/api/auth/sessions?action=revoke-session`

**Request Headers:**
```http
POST /api/auth/sessions?action=revoke-session HTTP/1.1
Content-Type: application/json
Cookie: [neon auth cookie]
```

#### Action: revoke-session

**Purpose:** Revoke a specific session by ID.

**Request Body:**
```json
{
  "sessionId": "sess_abc123xyz"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Missing or invalid sessionId in request body"
}
```

**Response (400 Bad Request - Current Session):**
```json
{
  "success": false,
  "error": "Cannot revoke current session. Use /api/auth/logout instead."
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "error": "Session not found or you do not have permission to revoke it"
}
```

**Constraints:**
- ❌ Cannot revoke the current session (use `/api/auth/logout` instead)
- ❌ Cannot revoke sessions belonging to other users
- ✅ Can only revoke own sessions

**Client-Side Usage:**
```typescript
async function revokeSession(sessionId: string) {
  const response = await fetch('/api/auth/sessions?action=revoke-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })

  const data = await response.json()
  if (data.success) {
    console.log('Session revoked')
  } else {
    console.error(data.error)
  }
}
```

#### Action: revoke-all-others

**Purpose:** Revoke all sessions except the current one (sign out all other devices).

**Request URL:** `/api/auth/sessions?action=revoke-all-others`

**Request Body:** Empty or omitted

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Revoked 2 other session(s)"
}
```

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Unauthorized - user not authenticated"
}
```

**Response (500 Server Error):**
```json
{
  "success": false,
  "error": "Failed to process session action"
}
```

**Client-Side Usage:**
```typescript
async function revokeAllOtherSessions() {
  const response = await fetch('/api/auth/sessions?action=revoke-all-others', {
    method: 'POST',
  })

  const data = await response.json()
  if (data.success) {
    console.log(data.message) // "Revoked 3 other session(s)"
  }
}
```

---

## Common Usage Examples

### Example 1: Build a Session Manager Component

```tsx
"use client"

import { useEffect, useState } from "react"

interface Session {
  id: string
  device: string
  browser: string
  os: string
  ipAddress: string | null
  lastActive: string
  isCurrent: boolean
}

export function SessionManager() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/sessions')
      const data = await res.json()
      if (data.success) {
        setSessions(data.sessions)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (sessionId: string) => {
    const res = await fetch('/api/auth/sessions?action=revoke-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })

    if (res.ok) {
      await fetchSessions()
    }
  }

  const handleRevokeAllOthers = async () => {
    const res = await fetch('/api/auth/sessions?action=revoke-all-others', {
      method: 'POST',
    })

    if (res.ok) {
      await fetchSessions()
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Active Sessions</h2>

      {sessions.length === 0 ? (
        <p>No active sessions</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">
                    {session.browser} on {session.os} ({session.device})
                  </p>
                  <p className="text-sm text-gray-600">
                    IP: {session.ipAddress || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Last active: {new Date(session.lastActive).toLocaleString()}
                  </p>
                  {session.isCurrent && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                      Current
                    </span>
                  )}
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleRevoke(session.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 1 && (
        <button
          onClick={handleRevokeAllOthers}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Sign Out All Other Devices
        </button>
      )}
    </div>
  )
}
```

### Example 2: Integrate Token Refresh in App

```tsx
// app/layout.tsx
"use client"

import { useTokenRefresh } from "@/hooks/use-token-refresh"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useTokenRefresh({
    checkIntervalMs: 60 * 1000, // Check every minute
    onRefresh: (success) => {
      if (success) {
        console.log("✓ Token refreshed automatically")
      }
    },
    onRefreshError: (error) => {
      console.error("✗ Token refresh failed:", error.message)
    },
  })

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

### Example 3: Settings Page with Security Options

```tsx
"use client"

import { SessionManager } from "@/components/auth/session-manager"
import { useTokenRefresh } from "@/hooks/use-token-refresh"

export function SettingsSecurityPage() {
  const { refreshNow } = useTokenRefresh()

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4">Security Settings</h2>

        <div className="space-y-4">
          <div className="border rounded p-4">
            <h3 className="font-medium mb-2">Token Management</h3>
            <p className="text-sm text-gray-600 mb-3">
              Your session token is automatically refreshed before expiration
              to maintain uninterrupted access.
            </p>
            <button
              onClick={refreshNow}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Now
            </button>
          </div>

          <SessionManager />
        </div>
      </section>
    </div>
  )
}
```

---

## Error Handling Guide

### Error Scenarios and Solutions

#### 401 Unauthorized
**Cause:** User not authenticated or session expired

**Solution:**
```typescript
try {
  const res = await fetch('/api/auth/sessions')
  if (res.status === 401) {
    // Redirect to login
    window.location.href = '/auth/sign-in'
  }
} catch (error) {
  console.error('Request failed:', error)
}
```

#### 400 Bad Request
**Cause:** Invalid request format or missing required fields

**Solution:**
```typescript
const data = await response.json()
if (!response.ok && response.status === 400) {
  console.error('Invalid request:', data.error)
  // Show error message to user
}
```

#### 404 Not Found
**Cause:** Session not found or already revoked

**Solution:**
```typescript
// Refresh session list after revocation
const res = await fetch('/api/auth/sessions?action=revoke-session', {
  method: 'POST',
  body: JSON.stringify({ sessionId }),
})

if (res.status === 404) {
  // Session already revoked, refresh list
  await fetchSessions()
}
```

#### 500 Server Error
**Cause:** Server-side error

**Solution:**
```typescript
if (res.status === 500) {
  console.error('Server error, retrying...')
  // Implement retry logic with exponential backoff
  setTimeout(() => retryRequest(), 1000)
}
```

---

## Rate Limiting

Currently, the session management API does **not have explicit rate limits** beyond Neon Auth's rate limiting. Consider adding rate limiting if needed:

```typescript
// Example: Rate limit revoke-session to 10 requests per minute
import { RateLimiter } from "express-rate-limit"

const sessionRevokeLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: "Too many session revocation requests, please try again later",
})

export async function POST(request: NextRequest) {
  // Apply limiter...
}
```

---

## Security Considerations

### Token Refresh
- ✅ Tokens are automatically refreshed 10 minutes before expiration
- ✅ Refresh happens transparently without user action
- ✅ No secrets transmitted to client
- ✅ Uses HTTPS only (production)

### Session Management
- ✅ Users can only manage their own sessions
- ✅ Cannot revoke current session (must use logout)
- ✅ All actions are logged
- ✅ IP address and User-Agent tracked per session

### Best Practices
1. Always use HTTPS in production
2. Implement optional 2FA for sensitive operations
3. Monitor token refresh failures
4. Alert users of suspicious session activity
5. Periodically clean up old sessions

---

## Support & Debugging

### Enable Debug Logging

```typescript
// In your app
import { logger } from "@/lib/server/logger"

// Logs will show:
// - Token refresh checks
// - JWT validation details
// - Session operations
```

### Check Dev Tools Network Tab

When using `useTokenRefresh()`:
1. Open DevTools (F12)
2. Go to Network tab
3. Look for POST requests to `/api/auth/refresh`
4. Check response headers for `X-Token-Refreshed`

### Test Session API Locally

```bash
# List sessions
curl -H "Cookie: [your-auth-cookie]" http://localhost:3000/api/auth/sessions

# Revoke a session
curl -X POST http://localhost:3000/api/auth/sessions?action=revoke-session \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-auth-cookie]" \
  -d '{"sessionId": "sess_123"}'
```

---

**Last Updated:** February 2, 2026  
**Next.js Version:** 16.1.6  
**Neon Auth:** Integrated
