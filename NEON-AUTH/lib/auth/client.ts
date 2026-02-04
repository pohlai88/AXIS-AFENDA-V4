"use client"

import { createAuthClient } from "@neondatabase/auth/next"

/**
 * Neon Auth Client
 * 
 * Client-side authentication SDK that communicates with the Neon Auth API
 * via the Next.js route handler at /api/auth/[...path].
 * 
 * Usage:
 *   authClient.signIn.email({ email, password })
 *   authClient.session.get()
 *   authClient.signOut()
 */
export const authClient = createAuthClient()
