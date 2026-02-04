/**
 * @domain magicfolder
 * @layer constants
 * @responsibility Doc types, status, upload status, dup reason, MIME and size limits
 */

export const DOC_TYPE = {
  INVOICE: "invoice",
  CONTRACT: "contract",
  RECEIPT: "receipt",
  OTHER: "other",
} as const

export type DocTypeKey = keyof typeof DOC_TYPE
export type DocTypeValue = (typeof DOC_TYPE)[DocTypeKey]

export const STATUS = {
  INBOX: "inbox",
  ACTIVE: "active",
  ARCHIVED: "archived",
  DELETED: "deleted",
} as const

export type StatusKey = keyof typeof STATUS
export type StatusValue = (typeof STATUS)[StatusKey]

export const UPLOAD_STATUS = {
  PRESIGNED: "presigned",
  UPLOADED: "uploaded",
  INGESTED: "ingested",
  FAILED: "failed",
} as const

export type UploadStatusKey = keyof typeof UPLOAD_STATUS
export type UploadStatusValue = (typeof UPLOAD_STATUS)[UploadStatusKey]

export const DUP_REASON = {
  EXACT: "exact",
  NEAR: "near",
} as const

export type DupReasonKey = keyof typeof DUP_REASON
export type DupReasonValue = (typeof DUP_REASON)[DupReasonKey]

/** Allowed MIME types for MagicFolder uploads */
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
] as const

/** Max file size in bytes (default 50 MB) */
export const MAX_FILE_BYTES = 50 * 1024 * 1024

/** SHA-256 hex string length */
export const SHA256_HEX_LENGTH = 64

/** View modes for hub (used in preferences and settings) */
export const VIEW_MODES = [
  { value: "cards" as const, label: "Cards" },
  { value: "table" as const, label: "Table" },
  { value: "board" as const, label: "Board" },
  { value: "timeline" as const, label: "Timeline" },
  { value: "relationship" as const, label: "Relationship" },
] as const

/** Items per page options */
export const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100] as const

/** Default sort options (value matches list API sortBy + sortOrder) */
export const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First" },
  { value: "createdAt-asc", label: "Oldest First" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "sizeBytes-desc", label: "Largest First" },
  { value: "sizeBytes-asc", label: "Smallest First" },
] as const
