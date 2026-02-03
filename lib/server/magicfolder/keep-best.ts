/**
 * @domain magicfolder
 * @layer server
 * @responsibility Set keepVersionId on duplicate group; optionally archive other versions
 */

import "@/lib/server/only"

import { and, eq } from "drizzle-orm"

import { getDb } from "@/lib/server/db/client"
import {
  magicfolderDuplicateGroupVersions,
  magicfolderDuplicateGroups,
  magicfolderObjects,
  magicfolderObjectVersions,
} from "@/lib/server/db/schema"

export type KeepBestResult =
  | { ok: true; groupId: string }
  | { ok: false; error: string }

/**
 * Set the "keep" version for a duplicate group. Optionally updates each object's
 * currentVersionId to the kept version for the object that owns it, and archives
 * other versions' objects (or leaves them visible for "duplicates" UI).
 */
export async function setKeepBest(
  groupId: string,
  versionId: string,
  tenantId: string,
  _ownerId: string
): Promise<KeepBestResult> {
  const db = getDb()

  const [group] = await db
    .select()
    .from(magicfolderDuplicateGroups)
    .where(eq(magicfolderDuplicateGroups.id, groupId))
    .limit(1)

  if (!group) {
    return { ok: false, error: "Group not found" }
  }
  if (group.tenantId !== tenantId) {
    return { ok: false, error: "Forbidden" }
  }

  const memberVersionIds = await db
    .select({ versionId: magicfolderDuplicateGroupVersions.versionId })
    .from(magicfolderDuplicateGroupVersions)
    .where(eq(magicfolderDuplicateGroupVersions.groupId, groupId))

  const versionIds = memberVersionIds.map((r) => r.versionId)
  if (!versionIds.includes(versionId)) {
    return { ok: false, error: "Version is not in this duplicate group" }
  }

  await db
    .update(magicfolderDuplicateGroups)
    .set({ keepVersionId: versionId })
    .where(eq(magicfolderDuplicateGroups.id, groupId))

  // Optional: set each object's currentVersionId to the kept version when that object owns it
  const [keptVersion] = await db
    .select({ objectId: magicfolderObjectVersions.objectId })
    .from(magicfolderObjectVersions)
    .where(eq(magicfolderObjectVersions.id, versionId))
    .limit(1)

  if (keptVersion) {
    await db
      .update(magicfolderObjects)
      .set({ currentVersionId: versionId, updatedAt: new Date() })
      .where(
        and(
          eq(magicfolderObjects.id, keptVersion.objectId),
          eq(magicfolderObjects.tenantId, tenantId)
        )
      )
  }

  return { ok: true, groupId }
}
