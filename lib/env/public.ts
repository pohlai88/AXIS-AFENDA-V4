import { z } from "zod"

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_SITE_DESCRIPTION: z.string().min(1).optional(),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

let cached: PublicEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (cached) return cached
  cached = PublicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SITE_DESCRIPTION: process.env.NEXT_PUBLIC_SITE_DESCRIPTION,
  })
  return cached
}

