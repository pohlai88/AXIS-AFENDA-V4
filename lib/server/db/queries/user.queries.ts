import "@/lib/server/only"

import { eq } from "drizzle-orm"

import { getDb } from "../client"
import { userProfiles } from "../schema"

export async function getUserProfileById(id: string) {
  const db = getDb()
  const rows = await db.select().from(userProfiles).where(eq(userProfiles.userId, id)).limit(1)
  return rows[0] ?? null
}

// Backwards-compatible alias (legacy naming)
export const getUserById = getUserProfileById

