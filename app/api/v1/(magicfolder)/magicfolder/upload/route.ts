/**
 * @domain magicfolder
 * @layer api
 * @responsibility Proxy upload route - handles file upload server-side to avoid CORS issues
 * Receives file, uploads to R2, creates upload record, and returns upload info
 */

import "@/lib/server/only"

import { PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "node:crypto"
import { createHash } from "node:crypto"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { ALLOWED_MIME_TYPES, MAX_FILE_BYTES } from "@/lib/constants/magicfolder"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getDb } from "@/lib/server/db/client"
import { magicfolderUploads } from "@/lib/server/db/schema"
import { getR2BucketName, getR2Client, isR2Configured } from "@/lib/server/r2/client"
import { quarantineSourceKey } from "@/lib/server/r2/magicfolder-keys"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestId = request.headers.get(HEADER_NAMES.REQUEST_ID) ?? undefined

  try {
    if (!isR2Configured()) {
      return fail(
        { code: "UNAVAILABLE", message: "Storage not configured", requestId },
        503
      )
    }

    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      throw new HttpError(400, "BAD_REQUEST", "No file provided")
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      throw new HttpError(400, "BAD_REQUEST", `File type ${file.type} not allowed`)
    }

    // Validate file size
    if (file.size > MAX_FILE_BYTES) {
      throw new HttpError(400, "BAD_REQUEST", `File too large. Max size is ${MAX_FILE_BYTES / (1024 * 1024)}MB`)
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Compute SHA-256 hash
    const sha256 = createHash("sha256").update(buffer).digest("hex")

    // Generate IDs
    const uploadId = randomUUID()
    const objectId = randomUUID()
    const versionId = randomUUID()
    const key = quarantineSourceKey(tenantId, uploadId)

    // Upload to R2
    const bucket = getR2BucketName()
    const s3 = getR2Client()
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
    await s3.send(command)

    // Create upload record
    const db = getDb()
    await db.insert(magicfolderUploads).values({
      id: uploadId,
      tenantId,
      ownerId: auth.userId,
      objectId,
      versionId,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      sha256,
      r2KeyQuarantine: key,
      status: "uploaded",
    })

    return ok({
      uploadId,
      objectId,
      versionId,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      sha256,
    })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    const message = e instanceof Error ? e.message : "Internal error"
    return fail({ code: "INTERNAL", message, requestId }, 500)
  }
}
