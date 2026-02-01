import "@/lib/server/only"

import { nanoid } from "nanoid"
import { timingSafeEqual } from "crypto"
import { db } from "@/lib/server/db"
import { verificationTokens } from "@/lib/server/db/schema"
import { eq, and, gt } from "drizzle-orm"

const UNLOCK_PREFIX = "unlock:"
const UNLOCK_TTL_MS = 60 * 60 * 1000 // 1 hour

export function buildUnlockIdentifier(email: string): string {
  return `${UNLOCK_PREFIX}${email.toLowerCase()}`
}

export async function createUnlockToken(email: string): Promise<{ token: string; expiresAt: Date }> {
  const token = nanoid(32)
  const expiresAt = new Date(Date.now() + UNLOCK_TTL_MS)

  await db.insert(verificationTokens).values({
    identifier: buildUnlockIdentifier(email),
    token,
    expires: expiresAt,
    createdAt: new Date(),
  })

  return { token, expiresAt }
}

export async function verifyUnlockToken(email: string, token: string): Promise<boolean> {
  const identifier = buildUnlockIdentifier(email)
  const now = new Date()

  const [entry] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.identifier, identifier), gt(verificationTokens.expires, now)))
    .limit(1)

  if (!entry) return false

  const stored = Buffer.from(entry.token)
  const provided = Buffer.from(token)

  if (stored.length !== provided.length) {
    return false
  }

  const valid = timingSafeEqual(stored, provided)

  if (valid) {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, entry.token))
  }

  return valid
}
