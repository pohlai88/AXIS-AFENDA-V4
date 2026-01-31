import { createAuthClient } from "@neondatabase/auth/next"

// Client + server compatible auth client for Neon Auth.
// Requires:
// - NEXT_PUBLIC_NEON_AUTH_URL (client)
// - NEON_AUTH_BASE_URL (server, for API handler)
export const authClient = createAuthClient()
