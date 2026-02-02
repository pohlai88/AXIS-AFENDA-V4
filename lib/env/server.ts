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

  // Neon Data API (optional; only required if using the Data API client)
  // Set to "true" to require NEON_DATA_API_URL configuration
  USE_NEON_DATA_API: z.enum(["true", "false"]).optional().default("false"),
  NEON_DATA_API_URL: z.string().url().optional(),

  // Optional: Neon project configuration
  // Used for managing branches and provisioning
  NEON_PROJECT_ID: z.string().min(1).optional(),
  NEON_BRANCH_ID: z.string().min(1).optional(),

  // CAPTCHA configuration (optional for extra security)
  // Note: CAPTCHA is disabled in this configuration
  CAPTCHA_SECRET_KEY: z.string().min(1).optional(),
  CAPTCHA_PROVIDER: z.enum(["hcaptcha", "recaptcha", "turnstile", "none"]).optional(),

  // Public URLs accessible in server context
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_NEON_AUTH_URL: z.string().url().optional(),
})
  // Validate conditional requirements for Data API
  .refine(
    (data) => data.USE_NEON_DATA_API === "false" || !!process.env.NEON_DATA_API_URL,
    {
      message: "NEON_DATA_API_URL is required when USE_NEON_DATA_API=true",
      path: ["NEON_DATA_API_URL"],
    }
  )

export type ServerEnv = z.infer<typeof ServerEnvSchema>

let cached: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (cached) return cached

  const result = ServerEnvSchema.safeParse(process.env)

  if (!result.success) {
    throw new Error(`Invalid server environment: ${result.error.message}`)
  }

  cached = result.data
  return cached
}

export function requireServerEnv<K extends keyof ServerEnv>(key: K): NonNullable<ServerEnv[K]> {
  const value = getServerEnv()[key]
  if (value == null || value === "") {
    throw new Error(
      `Missing required server environment variable: ${String(key)}\n` +
        `Set this variable in your .env.local or .env file.`
    )
  }
  return value as NonNullable<ServerEnv[K]>
}

