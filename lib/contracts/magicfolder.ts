/**
 * @domain magicfolder
 * @layer contracts
 * @responsibility Zod schemas for presign, ingest, list filters, and enums
 */

import { z } from "zod"

import {
  DOC_TYPE,
  STATUS,
  UPLOAD_STATUS,
  DUP_REASON,
  MAX_FILE_BYTES,
  SHA256_HEX_LENGTH,
} from "@/lib/constants/magicfolder"

// ============ Enums (Zod) ============

export const DocTypeSchema = z.enum([
  DOC_TYPE.INVOICE,
  DOC_TYPE.CONTRACT,
  DOC_TYPE.RECEIPT,
  DOC_TYPE.OTHER,
])
export type DocType = z.infer<typeof DocTypeSchema>

export const StatusSchema = z.enum([
  STATUS.INBOX,
  STATUS.ACTIVE,
  STATUS.ARCHIVED,
  STATUS.DELETED,
])
export type Status = z.infer<typeof StatusSchema>

export const UploadStatusSchema = z.enum([
  UPLOAD_STATUS.PRESIGNED,
  UPLOAD_STATUS.UPLOADED,
  UPLOAD_STATUS.INGESTED,
  UPLOAD_STATUS.FAILED,
])
export type UploadStatus = z.infer<typeof UploadStatusSchema>

export const DupReasonSchema = z.enum([DUP_REASON.EXACT, DUP_REASON.NEAR])
export type DupReason = z.infer<typeof DupReasonSchema>

// ============ Presign ============

const sha256Hex = z.string().length(SHA256_HEX_LENGTH).regex(/^[a-f0-9]+$/, "sha256 must be 64 hex chars")

export const MagicfolderPresignRequestSchema = z.object({
  filename: z.string().min(1).max(500),
  mimeType: z.enum([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
  ]),
  sizeBytes: z.number().int().positive().max(MAX_FILE_BYTES),
  sha256: sha256Hex,
})
export type MagicfolderPresignRequest = z.infer<typeof MagicfolderPresignRequestSchema>

export const MagicfolderPresignResponseSchema = z.object({
  uploadId: z.string().uuid(),
  objectId: z.string().uuid(),
  versionId: z.string().uuid(),
  key: z.string(),
  url: z.string().url(),
  expiresAt: z.number().int().positive(),
})
export type MagicfolderPresignResponse = z.infer<typeof MagicfolderPresignResponseSchema>

// ============ Ingest ============

export const MagicfolderIngestRequestSchema = z.object({
  uploadId: z.string().uuid(),
})
export type MagicfolderIngestRequest = z.infer<typeof MagicfolderIngestRequestSchema>

// ============ Keep Best ============

export const MagicfolderKeepBestRequestSchema = z.object({
  groupId: z.string().uuid(),
  versionId: z.string().uuid(),
})
export type MagicfolderKeepBestRequest = z.infer<typeof MagicfolderKeepBestRequestSchema>

// ============ Object status (PATCH) ============

export const MagicfolderUpdateStatusRequestSchema = z.object({
  status: StatusSchema,
})
export type MagicfolderUpdateStatusRequest = z.infer<typeof MagicfolderUpdateStatusRequestSchema>

// ============ Bulk actions ============

export const MagicfolderBulkRequestSchema = z.object({
  action: z.enum(["archive", "addTag", "delete", "activate"]),
  objectIds: z.array(z.string().uuid()).min(1).max(100),
  tagId: z.string().uuid().optional(),
})
export type MagicfolderBulkRequest = z.infer<typeof MagicfolderBulkRequestSchema>

// ============ List / filters (for single list API) ============

export const MagicfolderSortBySchema = z.enum(["createdAt", "title", "sizeBytes"])
export type MagicfolderSortBy = z.infer<typeof MagicfolderSortBySchema>
export const MagicfolderSortOrderSchema = z.enum(["asc", "desc"])
export type MagicfolderSortOrder = z.infer<typeof MagicfolderSortOrderSchema>

export const MagicfolderListQuerySchema = z.object({
  status: StatusSchema.optional(),
  docType: DocTypeSchema.optional(),
  q: z.string().min(1).max(500).optional(),
  tagId: z.string().uuid().optional(),
  hasTags: z.enum(["0", "1"]).optional(),
  hasType: z.enum(["0", "1"]).optional(),
  dupGroup: z.string().uuid().optional(),
  sortBy: MagicfolderSortBySchema.optional().default("createdAt"),
  sortOrder: MagicfolderSortOrderSchema.optional().default("desc"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})
export type MagicfolderListQuery = z.infer<typeof MagicfolderListQuerySchema>

// ============ Create tag (POST tags) ============

export const MagicfolderCreateTagRequestSchema = z.object({
  name: z.string().min(1).max(200).trim(),
})
export type MagicfolderCreateTagRequest = z.infer<typeof MagicfolderCreateTagRequestSchema>
