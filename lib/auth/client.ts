"use client"

import { createAuthClient } from "@neondatabase/auth/next"

// The auth client uses the Next.js API routes (/api/auth) which
// are handled by the auth.handler() in app/api/auth/[...path]/route.ts
export const authClient = createAuthClient()
