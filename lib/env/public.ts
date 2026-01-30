import { z } from "zod"

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

export type PublicEnv = z.infer<typeof PublicEnvSchema>

let cached: PublicEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (cached) return cached
  cached = PublicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })
  return cached
}

