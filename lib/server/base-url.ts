/**
 * @domain server
 * @layer util
 * @responsibility Base URL for server-side fetch to same-origin API (e.g. document detail page).
 * Uses NEXT_PUBLIC_APP_URL, VERCEL_URL, or headers host so relative routes resolve correctly.
 */

import "@/lib/server/only"

import { headers } from "next/headers"

/**
 * Returns the application base URL (origin) for server-side fetch.
 * Use when calling routes.api.* from Server Components or server code.
 */
export async function getAppBaseUrl(): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return appUrl.replace(/\/$/, "")
  }
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    const protocol = process.env.VERCEL_PROTOCOL ?? "https"
    return `${protocol}://${vercelUrl}`
  }
  const h = await headers()
  const host = h.get("host")
  const proto = h.get("x-forwarded-proto") ?? "https"
  if (host) {
    return `${proto}://${host}`
  }
  return "http://localhost:3000"
}
