"use client"

import { clearCache as clearApiCache } from "@/lib/api/client"

/**
 * Result of clearing all app caches (client-side only).
 */
export interface ClearAppCacheResult {
  apiCacheCleared: boolean
  swCachesCleared: number
}

/**
 * Clears client-side caches used by the app.
 * Safe to call from the browser; no-op for in-memory API cache if called from server.
 *
 * 1. In-memory API cache (apiFetch) – forces next GET requests to hit the network.
 * 2. Service Worker caches (when available) – api-cache, user-cache, app-routes, etc.
 *
 * Use after sign-out, when troubleshooting stale data, or from a "Clear cache" setting.
 */
export async function clearAppCache(): Promise<ClearAppCacheResult> {
  const result: ClearAppCacheResult = {
    apiCacheCleared: false,
    swCachesCleared: 0,
  }

  try {
    clearApiCache()
    result.apiCacheCleared = true
  } catch {
    // ignore
  }

  if (typeof caches !== "undefined") {
    try {
      const names = await caches.keys()
      await Promise.all(names.map((name) => caches.delete(name)))
      result.swCachesCleared = names.length
    } catch {
      // ignore
    }
  }

  return result
}
