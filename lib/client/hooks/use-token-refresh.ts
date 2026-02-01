"use client"

import { useEffect, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { COOKIE_NAMES } from "@/lib/constants"

interface RefreshResponse {
  token: string
  expiresAt: string
  success: boolean
}

const REFRESH_CHECK_INTERVAL_MS = 60000 // Check every 1 minute
const REFRESH_THRESHOLD_MS = 900000 // Refresh when < 15 minutes remaining

/**
 * Client-side hook to automatically refresh authentication tokens before expiry.
 * 
 * Features:
 * - Background refresh check every 1 minute
 * - Automatic refresh when < 15 minutes remaining
 * - Route change detection to refresh immediately if needed
 * - Silent refresh (no user interruption)
 * - Automatic logout on refresh failure
 * 
 * Usage:
 * ```tsx
 * function App() {
 *   useTokenRefresh()
 *   return <YourApp />
 * }
 * ```
 */
export function useTokenRefresh() {
  const router = useRouter()
  const pathname = usePathname()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  /**
   * Get token expiry from cookie
   */
  const getTokenExpiry = useCallback((): Date | null => {
    if (typeof document === "undefined") return null

    const cookies = document.cookie.split(";")
    const neonCookie = cookies.find((cookie) => cookie.trim().startsWith(COOKIE_NAMES.NEON_AUTH))

    if (!neonCookie) return null

    const token = neonCookie.split("=")[1]
    if (!token) return null

    try {
      // Decode JWT payload (base64)
      const payload = JSON.parse(atob(token.split(".")[1]))
      if (!payload.exp) return null

      return new Date(payload.exp * 1000)
    } catch {
      return null
    }
  }, [])

  /**
   * Check if token should be refreshed
   */
  const shouldRefresh = useCallback((expiresAt: Date | null): boolean => {
    if (!expiresAt) return false

    const timeRemaining = expiresAt.getTime() - Date.now()
    return timeRemaining > 0 && timeRemaining < REFRESH_THRESHOLD_MS
  }, [])

  /**
   * Refresh the authentication token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      // Already refreshing, skip
      return true
    }

    isRefreshingRef.current = true

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
      })

      if (!response.ok) {
        console.warn("Token refresh failed:", response.status, response.statusText)
        return false
      }

      const data: RefreshResponse = await response.json()

      if (!data.success) {
        console.warn("Token refresh returned unsuccessful response")
        return false
      }

      console.info("Token refreshed successfully, expires at:", data.expiresAt)
      return true
    } catch (error) {
      console.error("Token refresh error:", error)
      return false
    } finally {
      isRefreshingRef.current = false
    }
  }, [])

  /**
   * Check and refresh token if needed
   */
  const checkAndRefresh = useCallback(async () => {
    const expiresAt = getTokenExpiry()

    if (!expiresAt) {
      // No token found, user not authenticated
      return
    }

    if (expiresAt.getTime() <= Date.now()) {
      // Token already expired, redirect to login
      console.warn("Token expired, redirecting to login")
      router.push("/login")
      return
    }

    if (shouldRefresh(expiresAt)) {
      const success = await refreshToken()

      if (!success) {
        // Refresh failed, redirect to login
        console.warn("Token refresh failed, redirecting to login")
        router.push("/login")
      }
    }
  }, [getTokenExpiry, shouldRefresh, refreshToken, router])

  // Background refresh check (every 1 minute)
  useEffect(() => {
    intervalRef.current = setInterval(checkAndRefresh, REFRESH_CHECK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [checkAndRefresh])

  // Check on route change
  useEffect(() => {
    checkAndRefresh()
  }, [pathname, checkAndRefresh])

  // Initial check on mount
  useEffect(() => {
    checkAndRefresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
