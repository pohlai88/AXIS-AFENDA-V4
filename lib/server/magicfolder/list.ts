/**
 * @domain magicfolder
 * @layer server
 * @responsibility List objects (documents) and duplicate groups for tenant
 */

import "@/lib/server/only"

import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm"

import { getDb } from "@/lib/server/db/client"
import {
  magicfolderDuplicateGroupVersions,
  magicfolderDuplicateGroups,
  magicfolderObjectIndex,
  magicfolderObjectTags,
  magicfolderObjectVersions,
  magicfolderObjects,
  magicfolderTags,
} from "@/lib/server/db/schema"
import type { TagRow } from "./tags"
import { listTagsForObject, listTagsForObjects } from "./tags"

export type ListObjectsQuery = {
  status?: string
  docType?: string
  q?: string
  tagId?: string
  hasTags?: "0" | "1"
  hasType?: "0" | "1"
  dupGroup?: string
  sortBy?: "createdAt" | "title" | "sizeBytes"
  sortOrder?: "asc" | "desc"
  limit: number
  offset: number
}

export type ObjectWithVersion = {
  id: string
  tenantId: string
  ownerId: string
  title: string | null
  docType: string
  status: string
  currentVersionId: string | null
  deletedAt: Date | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
  version?: {
    id: string
    versionNo: number
    mimeType: string
    sizeBytes: number
    sha256: string
    createdAt: Date
  }
  tags?: TagRow[]
}

export async function listObjects(
  tenantId: string,
  query: ListObjectsQuery
): Promise<{ items: ObjectWithVersion[]; total: number; limit: number; offset: number }> {
  const db = getDb()

  const conditions = [eq(magicfolderObjects.tenantId, tenantId), isNull(magicfolderObjects.deletedAt)]
  if (query.status) {
    conditions.push(eq(magicfolderObjects.status, query.status))
  }
  if (query.docType) {
    conditions.push(eq(magicfolderObjects.docType, query.docType))
  }
  if (query.tagId) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${magicfolderObjectTags}
        WHERE ${magicfolderObjectTags.objectId} = ${magicfolderObjects.id}
        AND ${magicfolderObjectTags.tagId} = ${query.tagId}
      )`
    )
  }
  if (query.hasTags === "0") {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${magicfolderObjectTags}
        WHERE ${magicfolderObjectTags.objectId} = ${magicfolderObjects.id}
      )`
    )
  }
  if (query.hasTags === "1") {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${magicfolderObjectTags}
        WHERE ${magicfolderObjectTags.objectId} = ${magicfolderObjects.id}
      )`
    )
  }
  if (query.hasType === "0") {
    conditions.push(eq(magicfolderObjects.docType, "other"))
  }
  if (query.hasType === "1") {
    conditions.push(ne(magicfolderObjects.docType, "other"))
  }
  if (query.dupGroup) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${magicfolderDuplicateGroupVersions} dgv
        INNER JOIN ${magicfolderObjectVersions} ov ON ov.id = dgv.version_id
        WHERE dgv.group_id = ${query.dupGroup} AND ov.object_id = ${magicfolderObjects.id}
      )`
    )
  }
  const searchPattern = query.q?.trim()
  if (searchPattern) {
    const like = `%${searchPattern.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`
    // FTS when search_vector exists (migration 0011); else ILIKE on extracted_text
    const searchVectorCol = sql.raw('"search_vector"')
    conditions.push(
      sql`(
        (${magicfolderObjects.title} ILIKE ${like})
        OR
        EXISTS (
          SELECT 1 FROM ${magicfolderObjectIndex} oi
          WHERE oi.object_id = ${magicfolderObjects.id}
          AND oi.extracted_text IS NOT NULL
          AND (
            oi.extracted_text ILIKE ${like}
            OR (oi.${searchVectorCol} IS NOT NULL AND oi.${searchVectorCol} @@ plainto_tsquery('english', ${searchPattern}))
          )
        )
      )`
    )
  }

  const where = and(...conditions)

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(magicfolderObjects)
    .where(where)

  const total = totalResult[0]?.count ?? 0

  const sortBy = query.sortBy ?? "createdAt"
  const sortOrder = query.sortOrder ?? "desc"
  const orderByColumn =
    sortBy === "title"
      ? magicfolderObjects.title
      : sortBy === "sizeBytes"
        ? magicfolderObjectVersions.sizeBytes
        : magicfolderObjects.createdAt
  const orderByFn = sortOrder === "asc" ? asc : desc

  const rows = await db
    .select({
      object: magicfolderObjects,
      versionId: magicfolderObjectVersions.id,
      versionNo: magicfolderObjectVersions.versionNo,
      mimeType: magicfolderObjectVersions.mimeType,
      sizeBytes: magicfolderObjectVersions.sizeBytes,
      sha256: magicfolderObjectVersions.sha256,
      versionCreatedAt: magicfolderObjectVersions.createdAt,
    })
    .from(magicfolderObjects)
    .leftJoin(
      magicfolderObjectVersions,
      eq(magicfolderObjects.currentVersionId, magicfolderObjectVersions.id)
    )
    .where(where)
    .orderBy(
      orderByColumn != null
        ? orderByFn(orderByColumn)
        : desc(magicfolderObjects.createdAt)
    )
    .limit(query.limit)
    .offset(query.offset)

  const objectIds = rows.map((r) => r.object.id)
  const tagsByObjectId = await listTagsForObjects(tenantId, objectIds)

  const items: ObjectWithVersion[] = rows.map((r) => ({
    ...r.object,
    version: r.versionId
      ? {
        id: r.versionId,
        versionNo: r.versionNo!,
        mimeType: r.mimeType!,
        sizeBytes: r.sizeBytes!,
        sha256: r.sha256!,
        createdAt: r.versionCreatedAt!,
      }
      : undefined,
    tags: tagsByObjectId[r.object.id] ?? [],
  }))

  return { items, total, limit: query.limit, offset: query.offset }
}

export type ObjectDetailWithVersions = ObjectWithVersion & {
  versions: Array<{
    id: string
    versionNo: number
    mimeType: string
    sizeBytes: number
    sha256: string
    createdAt: Date
  }>
  tags: TagRow[]
  extractedText: string | null
  extractedFields: Record<string, unknown>
}

export async function getObjectById(
  tenantId: string,
  objectId: string
): Promise<ObjectDetailWithVersions | null> {
  const db = getDb()

  const [row] = await db
    .select({
      object: magicfolderObjects,
      versionId: magicfolderObjectVersions.id,
      versionNo: magicfolderObjectVersions.versionNo,
      mimeType: magicfolderObjectVersions.mimeType,
      sizeBytes: magicfolderObjectVersions.sizeBytes,
      sha256: magicfolderObjectVersions.sha256,
      versionCreatedAt: magicfolderObjectVersions.createdAt,
    })
    .from(magicfolderObjects)
    .leftJoin(
      magicfolderObjectVersions,
      eq(magicfolderObjects.currentVersionId, magicfolderObjectVersions.id)
    )
    .where(
      and(
        eq(magicfolderObjects.id, objectId),
        eq(magicfolderObjects.tenantId, tenantId),
        isNull(magicfolderObjects.deletedAt)
      )
    )
    .limit(1)

  if (!row?.object) return null

  const [allVersions, tags, indexRow] = await Promise.all([
    db
      .select({
        id: magicfolderObjectVersions.id,
        versionNo: magicfolderObjectVersions.versionNo,
        mimeType: magicfolderObjectVersions.mimeType,
        sizeBytes: magicfolderObjectVersions.sizeBytes,
        sha256: magicfolderObjectVersions.sha256,
        createdAt: magicfolderObjectVersions.createdAt,
      })
      .from(magicfolderObjectVersions)
      .where(eq(magicfolderObjectVersions.objectId, objectId))
      .orderBy(desc(magicfolderObjectVersions.versionNo)),
    listTagsForObject(tenantId, objectId),
    db
      .select({
        extractedText: magicfolderObjectIndex.extractedText,
        extractedFields: magicfolderObjectIndex.extractedFields,
      })
      .from(magicfolderObjectIndex)
      .where(eq(magicfolderObjectIndex.objectId, objectId))
      .limit(1),
  ])

  const idx = indexRow[0]

  return {
    ...row.object,
    version: row.versionId
      ? {
        id: row.versionId,
        versionNo: row.versionNo!,
        mimeType: row.mimeType!,
        sizeBytes: row.sizeBytes!,
        sha256: row.sha256!,
        createdAt: row.versionCreatedAt!,
      }
      : undefined,
    versions: allVersions,
    tags,
    extractedText: idx?.extractedText ?? null,
    extractedFields: (idx?.extractedFields as Record<string, unknown>) ?? {},
  }
}

export type DuplicateGroupWithVersions = {
  id: string
  tenantId: string
  reason: string
  keepVersionId: string | null
  createdAt: Date
  versions: {
    versionId: string
    objectId: string
    title: string | null
    mimeType: string
    sizeBytes: number
    sha256: string
    versionCreatedAt: Date
  }[]
}

export async function listDuplicateGroups(
  tenantId: string,
  limit: number,
  offset: number
): Promise<{ items: DuplicateGroupWithVersions[]; total: number; limit: number; offset: number }> {
  const db = getDb()

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(magicfolderDuplicateGroups)
    .where(eq(magicfolderDuplicateGroups.tenantId, tenantId))

  const total = totalResult[0]?.count ?? 0

  const groups = await db
    .select()
    .from(magicfolderDuplicateGroups)
    .where(eq(magicfolderDuplicateGroups.tenantId, tenantId))
    .orderBy(desc(magicfolderDuplicateGroups.createdAt))
    .limit(limit)
    .offset(offset)

  if (groups.length === 0) {
    return { items: [], total, limit, offset }
  }

  const groupIds = groups.map((g) => g.id)
  const versionRows = await db
    .select({
      groupId: magicfolderDuplicateGroupVersions.groupId,
      versionId: magicfolderDuplicateGroupVersions.versionId,
      objectId: magicfolderObjectVersions.objectId,
      title: magicfolderObjects.title,
      mimeType: magicfolderObjectVersions.mimeType,
      sizeBytes: magicfolderObjectVersions.sizeBytes,
      sha256: magicfolderObjectVersions.sha256,
      versionCreatedAt: magicfolderObjectVersions.createdAt,
    })
    .from(magicfolderDuplicateGroupVersions)
    .innerJoin(
      magicfolderObjectVersions,
      eq(magicfolderDuplicateGroupVersions.versionId, magicfolderObjectVersions.id)
    )
    .innerJoin(
      magicfolderObjects,
      eq(magicfolderObjectVersions.objectId, magicfolderObjects.id)
    )
    .where(inArray(magicfolderDuplicateGroupVersions.groupId, groupIds))
    .orderBy(desc(magicfolderObjectVersions.createdAt))

  const versionsByGroup = new Map<string, Array<(typeof versionRows)[number]>>()
  for (const row of versionRows) {
    const bucket = versionsByGroup.get(row.groupId)
    if (bucket) {
      bucket.push(row)
    } else {
      versionsByGroup.set(row.groupId, [row])
    }
  }

  const items: DuplicateGroupWithVersions[] = groups.map((g) => {
    const versions = versionsByGroup.get(g.id) ?? []
    return {
      id: g.id,
      tenantId: g.tenantId,
      reason: g.reason,
      keepVersionId: g.keepVersionId,
      createdAt: g.createdAt,
      versions: versions.map((v) => ({
        versionId: v.versionId,
        objectId: v.objectId,
        title: v.title,
        mimeType: v.mimeType,
        sizeBytes: v.sizeBytes,
        sha256: v.sha256,
        versionCreatedAt: v.versionCreatedAt,
      })),
    }
  })

  return { items, total, limit, offset }
}

/**
 * Dismiss a duplicate group (delete it). Only the group row is deleted;
 * cascade removes duplicate_group_versions. Caller must ensure tenant ownership.
 */
export async function dismissDuplicateGroup(
  tenantId: string,
  groupId: string
): Promise<{ deleted: boolean }> {
  const db = getDb()
  const deleted = await db
    .delete(magicfolderDuplicateGroups)
    .where(
      and(
        eq(magicfolderDuplicateGroups.id, groupId),
        eq(magicfolderDuplicateGroups.tenantId, tenantId)
      )
    )
    .returning({ id: magicfolderDuplicateGroups.id })
  return { deleted: deleted.length > 0 }
}
