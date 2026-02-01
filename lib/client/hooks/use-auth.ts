"use client"

import { useAuth as useNeonAuth } from "@/lib/client/hooks/useAuth"
import { authClient } from "@/lib/auth/client"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

/**
 * Legacy compatibility hook for modules that only need a userId.
 * Delegates to Neon Auth session hook.
 * Now includes signOut capability.
 */
export function useAuth() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useNeonAuth()

  const signOut = useCallback(async () => {
    try {
      // Call logout API endpoint
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      // Sign out via Neon Auth client
      await authClient.signOut()

      // Redirect to login
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if API call fails
      router.push('/login')
    }
  }, [router])

  if (isLoading) return null

  return {
    userId: user?.id ?? null,
    isAuthenticated,
    isLoading,
    signOut,
  }
}
