import "@/lib/server/only"
import { z } from "zod"

const ServerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Dev-only convenience: default tenant when cookie/header is missing.
  DEV_TENANT_ID: z.string().min(1).optional(),

  // Neon Auth configuration
  NEON_DATA_API_URL: z.string().url().optional(),
  NEON_JWT_SECRET: z.string().min(16).optional(),
  NEON_PROJECT_ID: z.string().min(1).optional(),
  NEON_BRANCH_ID: z.string().min(1).optional(),
  JWKS_URL: z.string().url().optional(),
  NEON_AUTH_BASE_URL: z.string().url().optional(),
  NEON_PASSWORDLESS_AUTH: z.string().optional(),
})

export type ServerEnv = z.infer<typeof ServerEnvSchema>

let cached: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (cached) return cached
  cached = ServerEnvSchema.parse(process.env)
  return cached
}

export function requireServerEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = getServerEnv()[key]
  if (value == null || value === "") {
    throw new Error(`Missing required server env: ${String(key)}`)
  }
  return value as NonNullable<ServerEnv[K]>
}

