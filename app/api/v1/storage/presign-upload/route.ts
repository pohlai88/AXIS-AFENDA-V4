/**
 * @domain storage
 * @layer api
 * @responsibility Generate presigned upload URL for Cloudflare R2 (Neon guide: cloudflare-r2)
 */

import "@/lib/server/only"

import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "node:crypto"
import { NextRequest } from "next/server"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { ok, fail } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getR2BucketName, getR2Client, R2_PUBLIC_BASE_URL } from "@/lib/server/r2/client"

export const dynamic = "force-dynamic"

const PRESIGN_EXPIRES_IN = 300 // 5 minutes

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
    const fileName = typeof body?.fileName === "string" ? body.fileName : undefined
    const contentType = typeof body?.contentType === "string" ? body.contentType : undefined

    if (!fileName || !contentType) {
      return fail(
        { code: "BAD_REQUEST", message: "fileName and contentType required", requestId },
        400
      )
    }

    const bucket = getR2BucketName()
    const objectKey = `${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const publicFileUrl = R2_PUBLIC_BASE_URL ? `${R2_PUBLIC_BASE_URL}/${objectKey}` : null

    const s3 = getR2Client()
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      ContentType: contentType,
    })
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_IN })

    return ok({
      success: true,
      presignedUrl,
      objectKey,
      publicFileUrl,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to prepare upload"
    return fail(
      { code: "PRESIGN_FAILED", message, requestId },
      500
    )
  }
}
