import { auth } from "@/lib/auth/server"

// Export the GET and POST handlers from the auth server instance
// This automatically handles all auth endpoints (/sign-in, /sign-out, /session, etc.)
export const { GET, POST } = auth.handler()

