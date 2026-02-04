/**
 * @domain magicfolder
 * @layer api
 * @responsibility Presigned GET URL for canonical source (view/download)
 */

import "@/lib/server/only"

import { GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { headers } from "next/headers"

import { HEADER_NAMES } from "@/lib/constants/headers"
import { HttpError, Unauthorized } from "@/lib/server/api/errors"
import { fail, ok } from "@/lib/server/api/response"
import { getAuthContext } from "@/lib/server/auth/context"
import { getTenantContext } from "@/lib/server/tenant/context"
import { getObjectById } from "@/lib/server/magicfolder/list"
import { getR2BucketName, getR2Client, isR2Configured } from "@/lib/server/r2/client"
import { canonicalSourceKey } from "@/lib/server/r2/magicfolder-keys"

export const dynamic = "force-dynamic"

const PRESIGN_EXPIRES_IN = 300 // 5 minutes

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id } = await params

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

    const object = await getObjectById(tenantId, id)
    if (!object) throw new HttpError(404, "NOT_FOUND", "Document not found")
    const versionId = object.currentVersionId
    if (!versionId) throw new HttpError(400, "BAD_REQUEST", "Document has no current version")

    const key = canonicalSourceKey(tenantId, id, versionId)
    const bucket = getR2BucketName()
    const s3 = getR2Client()
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const url = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_IN })

    return ok({ url })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
