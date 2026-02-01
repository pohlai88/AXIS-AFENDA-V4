"use client"

import { useTokenRefresh } from "@/lib/client/hooks/use-token-refresh"

/**
 * Client component to handle automatic token refresh
 * This should be rendered in authenticated app layouts
 */
export function TokenRefreshProvider() {
  useTokenRefresh()
  return null
}
