/**
 * @domain magicfolder
 * @layer api
 * @responsibility Debug endpoint to test tags database and tenant context
 */

import "@/lib/server/only"

import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getDb } from "@/lib/server/db/client"
import { magicfolderTags } from "@/lib/server/db/schema"
import { logger } from "@/lib/server/logger"

export const dynamic = "force-dynamic"

export async function GET() {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    // Step 1: Check auth context
    const auth = await getAuthContext()
    if (!auth.userId) throw Unauthorized()

    // Step 2: Check tenant context
    const tenant = await getTenantContext()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    // Step 3: Test database connection
    const db = getDb()

    // Step 4: Try to query tags table
    const tags = await db.select().from(magicfolderTags).limit(1)

    return ok({
      debug: {
        auth: { userId: auth.userId },
        tenant: { tenantId },
        database: { connected: true },
        tagsTable: { exists: true, sampleCount: tags.length },
      }
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)

    logger.error({ err: e, requestId }, '[tags/debug] Debug check failed')

    return fail({
      code: "INTERNAL",
      message: e instanceof Error ? e.message : "Internal error",
      details: e instanceof Error ? { stack: e.stack } : undefined,
      requestId
    }, 500)
  }
}
