import "@/lib/server/only"

import { and, desc, eq } from "drizzle-orm"

import { getDbHttp } from "../client-neon-http"
import { approvals } from "../schema"

export type ApprovalStatus = "pending" | "approved" | "rejected"

/**
 * Edge-safe queries: uses Neon serverless HTTP driver.
 * Import these from Edge route handlers (`export const runtime = "edge"`).
 */

export async function listApprovals(tenantId: string) {
  const db = await getDbHttp()
  return await db
    .select()
    .from(approvals)
    .where(eq(approvals.tenantId, tenantId))
    .orderBy(desc(approvals.createdAt))
}

export async function getApprovalById(tenantId: string, id: string) {
  const db = await getDbHttp()
  const rows = await db
    .select()
    .from(approvals)
    .where(and(eq(approvals.tenantId, tenantId), eq(approvals.id, id)))
    .limit(1)
  return rows[0] ?? null
}

export async function createApproval(tenantId: string, title: string) {
  const db = await getDbHttp()
  const id = crypto.randomUUID()
  const rows = await db
    .insert(approvals)
    .values({ id, tenantId, title, status: "pending" })
    .returning()
  return rows[0]
}

export async function updateApprovalStatus(
  tenantId: string,
  id: string,
  status: ApprovalStatus
) {
  const db = await getDbHttp()
  const rows = await db
    .update(approvals)
    .set({ status })
    .where(and(eq(approvals.tenantId, tenantId), eq(approvals.id, id)))
    .returning()
  return rows[0] ?? null
}

