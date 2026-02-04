/**
 * @domain magicfolder
 * @layer server
 * @responsibility Tags: list by tenant, add/remove tag on object
 */

import "@/lib/server/only"

import { and, eq, inArray } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import { getDb } from "@/lib/server/db/client"
import {
  magicfolderObjectTags,
  magicfolderObjects,
  magicfolderTags,
} from "@/lib/server/db/schema"
import { logger } from "@/lib/server/logger"

export type TagRow = {
  id: string
  tenantId: string
  name: string
  slug: string
  createdAt: Date
}

export async function listTagsByTenant(
  tenantId: string
): Promise<TagRow[]> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(magicfolderTags)
      .where(eq(magicfolderTags.tenantId, tenantId))
    return rows
  } catch (error) {
    logger.error({ err: error, tenantId }, "[magicfolder/tags] listTagsByTenant failed")
    throw error
  }
}

export async function listTagsForObject(
  tenantId: string,
  objectId: string
): Promise<TagRow[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: magicfolderTags.id,
      tenantId: magicfolderTags.tenantId,
      name: magicfolderTags.name,
      slug: magicfolderTags.slug,
      createdAt: magicfolderTags.createdAt,
    })
    .from(magicfolderObjectTags)
    .innerJoin(
      magicfolderTags,
      eq(magicfolderObjectTags.tagId, magicfolderTags.id)
    )
    .where(
      and(
        eq(magicfolderObjectTags.objectId, objectId),
        eq(magicfolderTags.tenantId, tenantId)
      )
    )
  return rows
}

/**
 * Batch-fetch tags for multiple objects. Returns a map objectId -> TagRow[].
 */
export async function listTagsForObjects(
  tenantId: string,
  objectIds: string[]
): Promise<Record<string, TagRow[]>> {
  if (objectIds.length === 0) return {}
  const db = getDb()
  const rows = await db
    .select({
      objectId: magicfolderObjectTags.objectId,
      id: magicfolderTags.id,
      tenantId: magicfolderTags.tenantId,
      name: magicfolderTags.name,
      slug: magicfolderTags.slug,
      createdAt: magicfolderTags.createdAt,
    })
    .from(magicfolderObjectTags)
    .innerJoin(
      magicfolderTags,
      eq(magicfolderObjectTags.tagId, magicfolderTags.id)
    )
    .where(
      and(
        inArray(magicfolderObjectTags.objectId, objectIds),
        eq(magicfolderTags.tenantId, tenantId)
      )
    )
  const map: Record<string, TagRow[]> = {}
  for (const id of objectIds) map[id] = []
  for (const r of rows) {
    const tag: TagRow = {
      id: r.id,
      tenantId: r.tenantId,
      name: r.name,
      slug: r.slug,
      createdAt: r.createdAt,
    }
    map[r.objectId].push(tag)
  }
  return map
}

export async function addTagToObject(
  tenantId: string,
  objectId: string,
  tagId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb()

  const [obj] = await db
    .select({ id: magicfolderObjects.id })
    .from(magicfolderObjects)
    .where(
      and(
        eq(magicfolderObjects.id, objectId),
        eq(magicfolderObjects.tenantId, tenantId)
      )
    )
    .limit(1)
  if (!obj) return { ok: false, error: "Object not found" }

  const [tag] = await db
    .select({ id: magicfolderTags.id })
    .from(magicfolderTags)
    .where(
      and(
        eq(magicfolderTags.id, tagId),
        eq(magicfolderTags.tenantId, tenantId)
      )
    )
    .limit(1)
  if (!tag) return { ok: false, error: "Tag not found" }

  await db
    .insert(magicfolderObjectTags)
    .values({ objectId, tagId })
    .onConflictDoNothing()
  return { ok: true }
}

export async function removeTagFromObject(
  tenantId: string,
  objectId: string,
  tagId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb()

  const [obj] = await db
    .select({ id: magicfolderObjects.id })
    .from(magicfolderObjects)
    .where(
      and(
        eq(magicfolderObjects.id, objectId),
        eq(magicfolderObjects.tenantId, tenantId)
      )
    )
    .limit(1)
  if (!obj) return { ok: false, error: "Object not found" }

  await db
    .delete(magicfolderObjectTags)
    .where(
      and(
        eq(magicfolderObjectTags.objectId, objectId),
        eq(magicfolderObjectTags.tagId, tagId)
      )
    )
  return { ok: true }
}

function nameToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export async function deleteTag(
  tenantId: string,
  tagId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb()
  const [tag] = await db
    .select({ id: magicfolderTags.id })
    .from(magicfolderTags)
    .where(
      and(
        eq(magicfolderTags.id, tagId),
        eq(magicfolderTags.tenantId, tenantId)
      )
    )
    .limit(1)
  if (!tag) return { ok: false, error: "Tag not found" }
  await db
    .delete(magicfolderObjectTags)
    .where(eq(magicfolderObjectTags.tagId, tagId))
  await db.delete(magicfolderTags).where(eq(magicfolderTags.id, tagId))
  return { ok: true }
}

export async function createTag(
  tenantId: string,
  name: string
): Promise<{ ok: true; tag: TagRow } | { ok: false; error: string }> {
  const db = getDb()
  const slug = nameToSlug(name)
  const id = randomUUID()
  await db.insert(magicfolderTags).values({
    id,
    tenantId,
    name,
    slug: slug || id.slice(0, 8),
  })
  const [tag] = await db.select().from(magicfolderTags).where(eq(magicfolderTags.id, id)).limit(1)
  if (!tag) return { ok: false, error: "Failed to create tag" }
  return { ok: true, tag }
}

/**
 * Find tag by name (slug match) or create it. Returns tag id for addTagToObject.
 */
export async function findOrCreateTagByName(
  tenantId: string,
  name: string
): Promise<{ ok: true; tagId: string } | { ok: false; error: string }> {
  const slug = nameToSlug(name)
  if (!slug) return { ok: false, error: "Invalid tag name" }
  const db = getDb()
  const [existing] = await db
    .select({ id: magicfolderTags.id })
    .from(magicfolderTags)
    .where(and(eq(magicfolderTags.tenantId, tenantId), eq(magicfolderTags.slug, slug)))
    .limit(1)
  if (existing) return { ok: true, tagId: existing.id }
  const created = await createTag(tenantId, name)
  if (!created.ok) return created
  return { ok: true, tagId: created.tag.id }
}
