import "@/lib/server/only"

import type { NextAuthOptions, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"

import { getServerEnv } from "@/lib/env/server"

function getAuthSecret() {
  const env = getServerEnv()
  const secret =
    env.NEXTAUTH_SECRET ??
    env.AUTH_SECRET ??
    env.SESSION_SECRET

  if (!secret && env.NODE_ENV === "production") {
    throw new Error("Missing auth secret: set NEXTAUTH_SECRET (recommended) in production.")
  }

  return secret ?? "insecure-dev-secret-change-me"
}

function devCredentialsEnabled() {
  const env = getServerEnv()
  return env.NODE_ENV !== "production" || env.ENABLE_DEV_CREDENTIALS
}

function getDevCredentials() {
  const env = getServerEnv()

  // In production, never fall back to default credentials.
  if (env.NODE_ENV === "production") {
    if (!env.DEV_AUTH_USERNAME || !env.DEV_AUTH_PASSWORD) {
      throw new Error(
        "Dev credentials are enabled in production but DEV_AUTH_USERNAME/DEV_AUTH_PASSWORD are missing."
      )
    }
    return { username: env.DEV_AUTH_USERNAME, password: env.DEV_AUTH_PASSWORD }
  }

  // In non-production, provide a safe default to avoid auth blockers.
  return {
    username: env.DEV_AUTH_USERNAME ?? "admin",
    password: env.DEV_AUTH_PASSWORD ?? "admin",
  }
}

export const authOptions: NextAuthOptions = {
  // Use a stable secret in production. For local dev we fall back to an insecure default.
  secret: getAuthSecret(),

  session: { strategy: "jwt" },

  providers: [
    ...(devCredentialsEnabled()
      ? [
          CredentialsProvider({
            name: "Credentials",
            credentials: {
              username: { label: "Username", type: "text" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              const { username: expectedUsername, password: expectedPassword } = getDevCredentials()
              const username = credentials?.username ?? ""
              const password = credentials?.password ?? ""

              if (username === expectedUsername && password === expectedPassword) {
                return { id: "dev-admin", name: "Dev Admin", email: "admin@local" }
              }

              return null
            },
          }),
        ]
      : []),
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

