import "@/lib/server/only"

import { eq } from "drizzle-orm"

import { getDb } from "../client"
import { users } from "../schema"

export async function getUserById(id: string) {
  const db = getDb()
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0] ?? null
}

