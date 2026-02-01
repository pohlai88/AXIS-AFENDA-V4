"use client"

import { authClient } from "@/lib/auth/client"

/**
 * Custom hook to access Neon Auth session
 * Wraps authClient.useSession() for convenient use throughout the app
 */
export function useAuth() {
  const session = authClient.useSession()

  return {
    session,
    user: session.data?.user,
    isLoading: session.isPending,
    isAuthenticated: Boolean(session.data),
  }
}
