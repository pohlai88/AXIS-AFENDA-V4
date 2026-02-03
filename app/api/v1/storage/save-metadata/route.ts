/**
 * @domain storage
 * @layer api
 * @responsibility Save R2 file metadata to Neon after client upload (Neon guide: cloudflare-r2)
 */

import "@/lib/server/only"

import { NextRequest } from "next/server"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { ok, fail } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getDb } from "@/lib/server/db/client"
import { r2Files } from "@/lib/server/db/schema"
import { R2_PUBLIC_BASE_URL } from "@/lib/server/r2/client"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const requestId = request.headers.get(HEADER_NAMES.REQUEST_ID) ?? undefined

  const auth = await getAuthContext()
  if (!auth.isAuthenticated || !auth.userId) {
    return fail(
      { code: "UNAUTHORIZED", message: "Sign in required", requestId },
      401
    )
  }

  try {
    const body = await request.json()
    const objectKey = typeof body?.objectKey === "string" ? body.objectKey : undefined
    const publicFileUrl = typeof body?.publicFileUrl === "string" ? body.publicFileUrl : undefined

    if (!objectKey) {
      return fail(
        { code: "BAD_REQUEST", message: "objectKey required", requestId },
        400
      )
    }

    const finalFileUrl =
      publicFileUrl ??
      (R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL}/${objectKey}` : "URL not available")

    const db = getDb()
    await db.insert(r2Files).values({
      objectKey,
      fileUrl: finalFileUrl,
      userId: auth.userId,
    })

    return ok({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save metadata"
    return fail(
      { code: "SAVE_METADATA_FAILED", message, requestId },
      500
    )
  }
}
