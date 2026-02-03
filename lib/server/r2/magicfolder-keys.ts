/**
 * @domain magicfolder
 * @layer server
 * @responsibility R2 key contract: quarantine then canonical
 *
 * Quarantine: t/{tenantId}/q/{uploadId}/source
 * Canonical:  t/{tenantId}/obj/{objectId}/v/{versionId}/source, preview.pdf, thumb/{page}.jpg, text.json
 */

import "@/lib/server/only"

export function quarantineSourceKey(tenantId: string, uploadId: string): string {
  return `t/${tenantId}/q/${uploadId}/source`
}

export function canonicalSourceKey(
  tenantId: string,
  objectId: string,
  versionId: string
): string {
  return `t/${tenantId}/obj/${objectId}/v/${versionId}/source`
}

export function canonicalPreviewKey(
  tenantId: string,
  objectId: string,
  versionId: string
): string {
  return `t/${tenantId}/obj/${objectId}/v/${versionId}/preview.pdf`
}

export function canonicalThumbKey(
  tenantId: string,
  objectId: string,
  versionId: string,
  page: number
): string {
  return `t/${tenantId}/obj/${objectId}/v/${versionId}/thumb/${page}.jpg`
}

export function canonicalTextKey(
  tenantId: string,
  objectId: string,
  versionId: string
): string {
  return `t/${tenantId}/obj/${objectId}/v/${versionId}/text.json`
}
