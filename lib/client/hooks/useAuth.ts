"use client"

import { useState, useEffect } from "react"

/**
 * Simple auth hook that fetches user information from the API
 * Returns user information for permission checks
 */
export function useAuth() {
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/v1/me")
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  }
}
