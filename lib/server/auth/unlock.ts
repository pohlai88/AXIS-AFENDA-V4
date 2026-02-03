import "@/lib/server/only"

import { nanoid } from "nanoid"
import { timingSafeEqual } from "crypto"
import { createHash } from "crypto"
import { getDb } from "@/lib/server/db"
import { unlockTokens } from "@/lib/server/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { resetLoginAttempts } from "@/lib/server/auth/rate-limit"

const UNLOCK_TTL_MS = 60 * 60 * 1000 // 1 hour

export function buildUnlockIdentifierHash(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex")
}

export async function createUnlockToken(email: string): Promise<{ token: string; expiresAt: Date }> {
  const db = getDb()
  const token = nanoid(32)
  const expiresAt = new Date(Date.now() + UNLOCK_TTL_MS)

  await db.insert(unlockTokens).values({
    identifierHash: buildUnlockIdentifierHash(email),
    token,
    expiresAt,
  })

  return { token, expiresAt }
}

export async function verifyUnlockToken(email: string, token: string): Promise<boolean> {
  const db = getDb()
  const identifierHash = buildUnlockIdentifierHash(email)
  const now = new Date()

  // Make verification + consumption atomic: only one concurrent caller should succeed.
  // This also avoids a race where two calls read the same row before deletion.
  const deleted = await db
    .delete(unlockTokens)
    .where(
      and(
        eq(unlockTokens.identifierHash, identifierHash),
        eq(unlockTokens.token, token),
        gt(unlockTokens.expiresAt, now)
      )
    )
    .returning({ token: unlockTokens.token })

  if (deleted.length === 0) return false

  // Keep timingSafeEqual to maintain behavior parity (even though the match was in SQL).
  const stored = Buffer.from(deleted[0]!.token)
  const provided = Buffer.from(token)
  if (stored.length !== provided.length) return false
  const valid = timingSafeEqual(stored, provided)

  if (valid) {
    // Clear lockout state for this email.
    await resetLoginAttempts({ email })
  }

  return valid
}
