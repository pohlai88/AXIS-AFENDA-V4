/**
 * @domain magicfolder
 * @layer api
 * @responsibility Storage availability (no auth; for layout/hub banner)
 */

import "@/lib/server/only"

import { ok } from "@/lib/server/api/response"
import { isR2Configured } from "@/lib/server/r2/client"

export const dynamic = "force-dynamic"

export async function GET() {
  return ok({ storageConfigured: isR2Configured() })
}
