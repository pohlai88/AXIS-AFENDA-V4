# Neon Auth & OAuth Configuration

**Status:** ✅ Complete - OAuth Enabled  
**Date:** February 2, 2026  
**Framework:** Next.js 16.1.6 with Neon Auth (Better Auth)

---

## Overview

This application uses **Neon Auth**, a managed authentication service that stores users, sessions, and auth configuration directly in your Neon database's `neon_auth` schema.

**Key Features:**
- ✅ Branch-aware authentication (auth data branches with your database)
- ✅ OAuth support (Google, GitHub)
- ✅ Email/password authentication
- ✅ Pre-built UI components
- ✅ JWT validation for Data API
- ✅ Row Level Security (RLS) compatible

---

## Configuration

### 1. Environment Variables

Required variables in `.env`:

```env
# Neon Auth Base URL (from Neon Console → Branch → Auth → Configuration)
NEON_AUTH_BASE_URL=https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth

# Public Auth URL (browser access)
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-fancy-wildflower-a1o82bpk.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth

# Auth Cookie Secret (generate with: openssl rand -base64 32)
NEON_AUTH_COOKIE_SECRET=rnIcCj8LoFwvuznP6kXTBr2w0J/f+Ezx/JHQVrAuFIE=

# OAuth Providers (Google, GitHub)
GOOGLE_CLIENT_ID=1044662705377-r68bil6v9v8sjl6mh3aphjura1ltgqbb.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

GITHUB_ID=Ov23lizviCIntRW1pBJx
GITHUB_SECRET=c027b30234c280b6e10a7e03915c8bce9e9a4e77
```

### 2. OAuth Provider Setup

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://nexuscanon.com/api/auth/callback/google`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL:
   - Development: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://nexuscanon.com/api/auth/callback/github`

### 3. Neon Console Configuration

1. Navigate to: **Project → Branch → Auth → Settings**
2. Enable OAuth providers:
   - ✅ Google (with your Client ID and Secret)
   - ✅ GitHub (with your Client ID and Secret)

---

## Implementation

### File Structure

```
app/
├── auth/[path]/page.tsx          # Auth pages (sign-in, sign-up, etc.)
├── account/[path]/page.tsx       # Account pages (settings, security)
├── api/auth/[...path]/route.ts   # Neon Auth API proxy
├── _components/
│   └── auth-provider.tsx         # NeonAuthUIProvider wrapper
└── layout.tsx                    # Root layout with AuthProvider

lib/
├── auth/
│   ├── server.ts                 # Server-side auth instance
│   └── client.ts                 # Client-side auth instance
```

### Server Instance (`lib/auth/server.ts`)

```typescript
import { createNeonAuth } from "@neondatabase/auth/next/server"

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
})
```

### Client Instance (`lib/auth/client.ts`)

```typescript
"use client"

import { createAuthClient } from "@neondatabase/auth/next"

export const authClient = createAuthClient()
```

### Auth Provider (`app/_components/auth-provider.tsx`)

```typescript
"use client"

import { NeonAuthUIProvider } from "@neondatabase/auth/react"
import { authClient } from "@/lib/auth/client"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      redirectTo="/account/settings"
      social={{
        providers: ["google", "github"],
      }}
    >
      {children}
    </NeonAuthUIProvider>
  )
}
```

---

## Usage

### Available Routes

#### Authentication Pages (`/auth/[path]`)
- `/auth/sign-in` - Sign in with email/password or OAuth (Google, GitHub)
- `/auth/sign-up` - New account registration
- `/auth/sign-out` - Sign out
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password` - Complete password reset

#### Account Pages (`/account/[path]`)
- `/account/settings` - User profile management
- `/account/security` - Password change and active sessions

### Server Components

```typescript
import { auth } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export default async function ServerPage() {
  const { data: session } = await auth.getSession()
  
  if (!session) {
    redirect("/auth/sign-in")
  }
  
  return <div>User: {session.user.email}</div>
}
```

### Client Components

```typescript
"use client"

import { authClient } from "@/lib/auth/client"
import { useEffect, useState } from "react"

export function ClientComponent() {
  const [user, setUser] = useState(null)
  
  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.session) {
        setUser(data.session.user)
      }
    })
  }, [])
  
  return <div>User: {user?.email}</div>
}
```

### OAuth Sign-In

```typescript
// Google
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/account/settings",
})

// GitHub
await authClient.signIn.social({
  provider: "github",
  callbackURL: "/account/settings",
})
```

---

## Security Features

### Implemented in `/api/auth/[...path]/route.ts`

1. **Rate Limiting**
   - Email-based lockout after 5 failed attempts
   - IP-based rate limiting
   - Configurable lockout duration

2. **CAPTCHA Verification**
   - hCaptcha integration
   - Required after multiple failed attempts

3. **Audit Logging**
   - Failed login attempts logged
   - Account lockout events tracked

---

## Database Schema

Neon Auth creates the following tables in the `neon_auth` schema:

- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth accounts
- `verification` - Email verification tokens
- `organization` (optional) - Multi-tenant organizations

**Query users:**
```sql
SELECT * FROM neon_auth.user;
```

**Query sessions:**
```sql
SELECT * FROM neon_auth.session WHERE user_id = '<user-id>';
```

---

## Branching Authentication

When you create a branch in Neon, the entire `neon_auth` schema is branched:

```bash
# Create a branch with auth data
neonctl branches create --name=preview-123

# Get branch-specific auth URL
PREVIEW_AUTH_URL=https://ep-xxx.neonauth.ap-southeast-1.aws.neon.tech/neondb/auth
```

Use branch-specific auth URLs in preview deployments:
- Vercel Preview: Auto-detected via `NEON_BRANCH_ID` env var
- GitHub Actions: Use [Neon Create Branch Action](https://github.com/marketplace/actions/neon-create-branch-github-action)

---

## Troubleshooting

### Safari Cookie Issues

Safari blocks third-party cookies on non-HTTPS. For local development:

```bash
npm run dev -- --experimental-https
# Then open https://localhost:3000
```

### OAuth Callback Errors

1. Verify redirect URIs match exactly (including http vs https)
2. Check OAuth credentials in Neon Console match `.env`
3. Ensure `NEON_AUTH_BASE_URL` is correct

### Session Issues

```typescript
// Clear session
await authClient.signOut()

// Force session refresh
await authClient.getSession({ refresh: true })
```

---

## References

- [Neon Auth Overview](https://neon.com/docs/auth/overview)
- [Next.js Quick Start](https://neon.com/docs/auth/quick-start/nextjs)
- [OAuth Setup Guide](https://neon.com/docs/auth/guides/setup-oauth)
- [User Management](https://neon.com/docs/auth/guides/user-management)
- [Password Reset](https://neon.com/docs/auth/guides/password-reset)
- [Better Auth Docs](https://www.better-auth.com/)

---

## Next Steps

- [ ] Configure email verification (requires Resend/SendGrid)
- [ ] Set up organization support (multi-tenant)
- [ ] Implement Row Level Security (RLS) policies
- [ ] Configure custom email templates
- [ ] Add more OAuth providers (Microsoft, Apple, etc.)
