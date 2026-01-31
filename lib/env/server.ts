import "@/lib/server/only"
import { z } from "zod"

const ServerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Prefer NEXTAUTH_SECRET (standard) but keep AUTH_SECRET/SESSION_SECRET for compatibility.
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  SESSION_SECRET: z.string().min(16).optional(),

  // Dev-only convenience: default tenant when cookie/header is missing.
  DEV_TENANT_ID: z.string().min(1).optional(),

  // Dev auth convenience (Credentials provider).
  // - Enabled by default in non-production.
  // - Can be explicitly enabled in production by setting ENABLE_DEV_CREDENTIALS=true
  //   and providing DEV_AUTH_USERNAME/DEV_AUTH_PASSWORD (not recommended).
  ENABLE_DEV_CREDENTIALS: z.coerce.boolean().optional().default(false),
  DEV_AUTH_USERNAME: z.string().min(1).optional(),
  DEV_AUTH_PASSWORD: z.string().min(1).optional(),

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

