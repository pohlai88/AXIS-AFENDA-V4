import "@/lib/server/only"

export type ApprovalStatus = "pending" | "approved" | "rejected"

/**
 * Edge-safe queries: uses Neon serverless HTTP driver.
 * Import these from Edge route handlers (`export const runtime = "edge"`).
 */

// TODO: Re-implement approvals with tasks schema if needed
export async function listApprovals(tenantId: string) {
  void tenantId
  return []
}

export async function getApprovalById(tenantId: string, id: string) {
  void tenantId
  void id
  return null
}

export async function createApproval(tenantId: string, title: string) {
  void tenantId
  void title
  throw new Error("Approvals deprecated; use tasks instead")
}

export async function updateApprovalStatus(
  tenantId: string,
  id: string,
  status: ApprovalStatus
) {
  void tenantId
  void id
  void status
  return null
}