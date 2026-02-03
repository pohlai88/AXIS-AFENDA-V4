/**
 * @domain magicfolder
 * @layer server
 * @responsibility Update object status (approve, archive); bulk actions
 */

import "@/lib/server/only"

import { and, eq, inArray } from "drizzle-orm"

import { STATUS } from "@/lib/constants/magicfolder"
import { getDb } from "@/lib/server/db/client"
import { magicfolderObjects } from "@/lib/server/db/schema"
import { addTagToObject } from "./tags"

export type UpdateStatusResult =
  | { ok: true }
  | { ok: false; error: string }

export async function updateObjectStatus(
  tenantId: string,
  objectId: string,
  status: string
): Promise<UpdateStatusResult> {
  const db = getDb()
  const [row] = await db
    .select({ id: magicfolderObjects.id })
    .from(magicfolderObjects)
    .where(
      and(
        eq(magicfolderObjects.id, objectId),
        eq(magicfolderObjects.tenantId, tenantId)
      )
    )
    .limit(1)
  if (!row) return { ok: false, error: "Object not found" }
  if (!Object.values(STATUS).includes(status as (typeof STATUS)[keyof typeof STATUS])) {
    return { ok: false, error: "Invalid status" }
  }
  await db
    .update(magicfolderObjects)
    .set({ status, updatedAt: new Date() })
    .where(eq(magicfolderObjects.id, objectId))
  return { ok: true }
}

export type BulkAction = "archive" | "addTag"
export type BulkActionResult =
  | { ok: true; updated: number }
  | { ok: false; error: string }

export async function runBulkAction(
  tenantId: string,
  objectIds: string[],
  action: BulkAction,
  tagId?: string
): Promise<BulkActionResult> {
  if (objectIds.length === 0) return { ok: true, updated: 0 }
  const db = getDb()

  if (action === "archive") {
    await db
      .update(magicfolderObjects)
      .set({ status: STATUS.ARCHIVED, updatedAt: new Date() })
      .where(
        and(
          inArray(magicfolderObjects.id, objectIds),
          eq(magicfolderObjects.tenantId, tenantId)
        )
      )
    return { ok: true, updated: objectIds.length }
  }

  if (action === "addTag") {
    if (!tagId) return { ok: false, error: "tagId required for addTag" }
    let updated = 0
    for (const objectId of objectIds) {
      const r = await addTagToObject(tenantId, objectId, tagId)
      if (r.ok) updated++
    }
    return { ok: true, updated }
  }

  return { ok: false, error: "Unknown action" }
}
