import { z } from "zod"

/**
 * MagicToDo Tenancy Model
 *
 * Individual-first architecture: every user owns their workspace, tasks, and projects.
 * Scaling path: individual → organization (multiple users) → team (sub-projects/roles).
 *
 * Key rules:
 * - User ID is the primary tenant boundary.
 * - All tasks, projects, and data are scoped by user_id.
 * - Authentication provides user_id; all queries filter by user_id.
 * - Future: Org/team expansion via membership table.
 */

export const tenancySchema = z.object({
  userId: z.string().min(1, "User ID is required").describe("Primary tenant ID"),
  orgId: z.string().optional().describe("Future: organization ID for scaling"),
  teamId: z.string().optional().describe("Future: team ID for sub-projects"),
})

export type TenancyContext = z.infer<typeof tenancySchema>

/**
 * Tenancy enforcement helpers
 */
export function getTenancyFromRequest(headers: Record<string, string | string[] | undefined>): TenancyContext {
  const userId = headers["x-user-id"]
  if (!userId || typeof userId !== "string") {
    throw new Error("Missing x-user-id header")
  }
  return {
    userId,
    orgId: typeof headers["x-org-id"] === "string" ? headers["x-org-id"] : undefined,
    teamId: typeof headers["x-team-id"] === "string" ? headers["x-team-id"] : undefined,
  }
}
