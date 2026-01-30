import "@/lib/server/only"

import { eq } from "drizzle-orm"

import { getDbHttp } from "../client-neon-http"
import { users } from "../schema"

/**
 * Edge-safe queries: uses Neon serverless HTTP driver.
 * Import these from Edge route handlers (`export const runtime = "edge"`).
 */

export async function getUserById(id: string) {
  const db = await getDbHttp()
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0] ?? null
}

