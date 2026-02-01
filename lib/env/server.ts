import "@/lib/server/only"
import { z } from "zod"

const ServerEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Dev-only convenience: default tenant when cookie/header is missing.
  DEV_TENANT_ID: z.string().min(1).optional(),

  // Neon Auth configuration (managed authentication service)
  // These variables are required for Neon Auth to work
  NEON_AUTH_BASE_URL: z.string().url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32),
  
  // Optional: Neon project configuration
  // Used for managing branches and provisioning
  NEON_PROJECT_ID: z.string().min(1).optional(),
  NEON_BRANCH_ID: z.string().min(1).optional(),

  // Email service configuration
  RESEND_API_KEY: z.string().min(1).optional(),

  // CAPTCHA configuration (optional for extra security)
  CAPTCHA_SECRET_KEY: z.string().min(1).optional(),
  CAPTCHA_PROVIDER: z.enum(["hcaptcha", "recaptcha", "turnstile", "none"]).optional(),

  // Public URLs accessible in server context
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_NEON_AUTH_URL: z.string().url().optional(),
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

