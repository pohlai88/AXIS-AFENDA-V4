/**
 * @domain magicfolder
 * @layer api
 * @responsibility Presigned GET URL for thumbnail (thumb/{page}.jpg when generated)
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
import { getR2BucketName, getR2Client } from "@/lib/server/r2/client"
import { canonicalThumbKey } from "@/lib/server/r2/magicfolder-keys"

export const dynamic = "force-dynamic"

const PRESIGN_EXPIRES_IN = 300 // 5 minutes

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = (await headers()).get(HEADER_NAMES.REQUEST_ID) ?? undefined
  const { id } = await params
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10) || 1)

  try {
    const [auth, tenant] = await Promise.all([getAuthContext(), getTenantContext()])
    if (!auth.userId) throw Unauthorized()
    const tenantId = tenant.tenantId
    if (!tenantId) throw Unauthorized("Missing tenant")

    const object = await getObjectById(tenantId, id)
    if (!object) throw new HttpError(404, "NOT_FOUND", "Document not found")
    const versionId = object.currentVersionId
    if (!versionId) throw new HttpError(400, "BAD_REQUEST", "Document has no current version")

    const key = canonicalThumbKey(tenantId, id, versionId, page)
    const bucket = getR2BucketName()
    const s3 = getR2Client()
    const command = new GetObjectCommand({ Bucket: bucket, Key: key })
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_EXPIRES_IN })

    return ok({ url: presignedUrl })
  } catch (e) {
    if (e instanceof HttpError) return fail(e.toApiError(requestId), e.status)
    return fail({ code: "INTERNAL", message: "Internal error", requestId }, 500)
  }
}
