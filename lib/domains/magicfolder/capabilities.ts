/**
 * @domain magicfolder
 * @layer config
 * @responsibility Capabilities derived from env; drive UI affordances (upload, bulk, FTS, preview, etc.)
 */

import { getPublicEnv } from "@/lib/env/public"

export type MagicfolderCapabilities = {
  canUpload: boolean
  canBulkTag: boolean
  canBulkArchive: boolean
  canResolveDuplicates: boolean
  hasFTS: boolean
  hasPreview: boolean
  hasThumbs: boolean
}

function flag(value: string | undefined): boolean {
  return value !== "false" && value !== "0"
}

export function getMagicfolderCapabilities(): MagicfolderCapabilities {
  const env = getPublicEnv()
  return {
    canUpload: flag(env.NEXT_PUBLIC_MAGICFOLDER_CAN_UPLOAD),
    canBulkTag: flag(env.NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_TAG),
    canBulkArchive: flag(env.NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_ARCHIVE),
    canResolveDuplicates: flag(env.NEXT_PUBLIC_MAGICFOLDER_CAN_RESOLVE_DUPLICATES),
    hasFTS: flag(env.NEXT_PUBLIC_MAGICFOLDER_HAS_FTS),
    hasPreview: flag(env.NEXT_PUBLIC_MAGICFOLDER_HAS_PREVIEW),
    hasThumbs: flag(env.NEXT_PUBLIC_MAGICFOLDER_HAS_THUMBS),
  }
}
