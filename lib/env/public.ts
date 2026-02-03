import { z } from "zod"

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_DESCRIPTION: z.string().min(1).optional(),
  NEXT_PUBLIC_NEON_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_HCAPTCHA_SITE_KEY: z.string().min(1).optional(),
  // MagicFolder capabilities (optional; when unset, feature is on)
  NEXT_PUBLIC_MAGICFOLDER_CAN_UPLOAD: z.string().optional(),
  NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_TAG: z.string().optional(),
  NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_ARCHIVE: z.string().optional(),
  NEXT_PUBLIC_MAGICFOLDER_CAN_RESOLVE_DUPLICATES: z.string().optional(),
  NEXT_PUBLIC_MAGICFOLDER_HAS_FTS: z.string().optional(),
  NEXT_PUBLIC_MAGICFOLDER_HAS_PREVIEW: z.string().optional(),
  NEXT_PUBLIC_MAGICFOLDER_HAS_THUMBS: z.string().optional(),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

let cached: PublicEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (cached) return cached
  cached = PublicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
    NEXT_PUBLIC_NEON_AUTH_URL: process.env.NEXT_PUBLIC_NEON_AUTH_URL,
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY,
    NEXT_PUBLIC_MAGICFOLDER_CAN_UPLOAD: process.env.NEXT_PUBLIC_MAGICFOLDER_CAN_UPLOAD,
    NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_TAG: process.env.NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_TAG,
    NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_ARCHIVE: process.env.NEXT_PUBLIC_MAGICFOLDER_CAN_BULK_ARCHIVE,
    NEXT_PUBLIC_MAGICFOLDER_CAN_RESOLVE_DUPLICATES: process.env.NEXT_PUBLIC_MAGICFOLDER_CAN_RESOLVE_DUPLICATES,
    NEXT_PUBLIC_MAGICFOLDER_HAS_FTS: process.env.NEXT_PUBLIC_MAGICFOLDER_HAS_FTS,
    NEXT_PUBLIC_MAGICFOLDER_HAS_PREVIEW: process.env.NEXT_PUBLIC_MAGICFOLDER_HAS_PREVIEW,
    NEXT_PUBLIC_MAGICFOLDER_HAS_THUMBS: process.env.NEXT_PUBLIC_MAGICFOLDER_HAS_THUMBS,
  })
  return cached
}

