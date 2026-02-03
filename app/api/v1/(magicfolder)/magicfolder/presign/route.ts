/**
 * @domain magicfolder
 * @layer api
 * @responsibility Presign PUT to R2 quarantine key; create upload row with objectId/versionId
 */

import "@/lib/server/only"

import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "node:crypto"

import { HEADER_NAMES } from "@/lib/constants/headers"
import type { MagicfolderPresignResponse } from "@/lib/contracts/magicfolder"
import { MagicfolderPresignRequestSchema } from "@/lib/contracts/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { parseJson } from "@/lib/server/api/validate"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getDb } from "@/lib/server/db/client"
import { magicfolderUploads } from "@/lib/server/db/schema"
import { getR2BucketName, getR2Client } from "@/lib/server/r2/client"
import { quarantineSourceKey } from "@/lib/server/r2/magicfolder-keys"

export const dynamic = "force-dynamic"

const PRESIGN_EXPIRES_IN = 300 // 5 minutes

export async function POST(request: Request) {
  const requestId = request.headers.get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const body = await parseJson(request, MagicfolderPresignRequestSchema)

    const uploadId = randomUUID()
    const objectId = randomUUID()
    const versionId = randomUUID()
    const key = quarantineSourceKey(tenantId, uploadId)

    const db = getDb()
    await db.insert(magicfolderUploads).values({
      id: uploadId,
      tenantId,
      ownerId: auth.userId,
      objectId,
      versionId,
      filename: body.filename,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
      sha256: body.sha256,
      r2KeyQuarantine: key,
      status: "presigned",
    })

    const bucket = getR2BucketName()
    const s3 = getR2Client()
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: body.mimeType,
    })
    const url = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_IN })

    const expiresAt = Math.floor(Date.now() / 1000) + PRESIGN_EXPIRES_IN
    const response: MagicfolderPresignResponse = {
      uploadId,
      objectId,
      versionId,
      key,
      url,
      expiresAt,
    }
    return ok(response)
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
