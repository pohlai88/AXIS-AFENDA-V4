import { createNeonAuth } from "@neondatabase/auth/next/server"
import { requireServerEnv } from "@/lib/env/server"

/**
 * Neon Auth Instance
 * 
 * Manages authentication via Neon's managed auth service.
 * All user/session data is stored in the neon_auth schema
 * and branches with your database.
 */
export const auth = createNeonAuth({
  baseUrl: requireServerEnv("NEON_AUTH_BASE_URL"),
  cookies: {
    secret: requireServerEnv("NEON_AUTH_COOKIE_SECRET"),
  },
})
