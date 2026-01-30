"use client"

import { useEffect, useState } from "react"

/**
 * Client-side hook to get authenticated user info from server session.
 * Reads from /api/v1/me endpoint which is auth-protected.
 */
export function useAuth() {
  const [auth, setAuth] = useState<{ userId: string | null } | null>(null)

  useEffect(() => {
    const fetchAuth = async () => {
      try {
        const res = await fetch("/api/v1/me")
        if (res.ok) {
          const data = await res.json()
          setAuth({ userId: data.data?.userId || null })
        } else {
          setAuth({ userId: null })
        }
      } catch {
        setAuth({ userId: null })
      }
    }

    fetchAuth()
  }, [])

  return auth
}
