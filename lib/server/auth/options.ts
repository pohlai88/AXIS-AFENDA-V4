import "@/lib/server/only"

import type { NextAuthOptions, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"

import { getServerEnv } from "@/lib/env/server"

const DEV_USERNAME = "admin"
const DEV_PASSWORD = "admin"

export const authOptions: NextAuthOptions = {
  // Use a stable secret in production. For local dev we fall back to an insecure default.
  secret:
    getServerEnv().NEXTAUTH_SECRET ??
    getServerEnv().AUTH_SECRET ??
    getServerEnv().SESSION_SECRET ??
    "insecure-dev-secret-change-me",

  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username ?? ""
        const password = credentials?.password ?? ""

        // Dev-only baseline credentials (replace with OIDC provider later).
        if (username === DEV_USERNAME && password === DEV_PASSWORD) {
          return { id: "dev-admin", name: "Dev Admin", email: "admin@local" }
        }

        return null
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | null }) {
      if (user?.id) token.sub = user.id as string
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        // Ensure user.id is available for server-side auth context mapping.
        session.user.id = token.sub
      }
      return session
    },
  },
}

