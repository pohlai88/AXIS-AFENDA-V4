import "@/lib/server/only"

import { withRlsHttp } from "@/lib/server/db/rls-http"

/**
 * Edge-safe queries: uses Neon serverless HTTP driver.
 * Import these from Edge route handlers (`export const runtime = "edge"`).
 */

export async function getUserProfileById(id: string) {
  const rows = await withRlsHttp<{ user_id: string }[]>(
    { userId: id },
    (txn) => txn`select * from public.neon_user_profiles where user_id = ${id} limit 1`
  )
  return rows[0] ?? null
}

// Backwards-compatible alias (legacy naming)
export const getUserById = getUserProfileById

