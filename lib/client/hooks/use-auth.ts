"use client"

import { useEffect, useState } from "react"

/**
 * Client-side hook to get authenticated user info from server session.
 * Reads from /api/v1/me endpoint which is auth-protected.
 */
export function useAuth() {
  const [auth, setAuth] = useState<{ userId: string | null } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const run = async () => {
      try {
        const res = await fetch("/api/v1/me", {
          signal: controller.signal,
          credentials: "include",
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json()
          setAuth({ userId: data.data?.auth?.userId ?? null })
        } else {
          setAuth({ userId: null })
        }
      } catch {
        // Ignore abort errors; treat all other failures as unauthenticated.
        setAuth({ userId: null })
      }
    }

    void run()
    return () => controller.abort()
  }, [])

  return auth
}
