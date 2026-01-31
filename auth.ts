import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import type { Account, NextAuthOptions, Session, User } from "next-auth"
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser, VerificationToken } from "next-auth/adapters"
import type { JWT } from "next-auth/jwt"
import { getServerEnv } from "@/lib/env/server"
import { db } from "@/lib/server/db"
import { users, accounts, sessions, verificationTokens, userActivityLog } from "@/lib/server/db/schema"
import { eq, and } from "drizzle-orm"
import bcrypt from "bcryptjs"

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

// Database adapter functions
type CreateUserInput = Omit<AdapterUser, "id">
type UpdateUserInput = Partial<AdapterUser> & Pick<AdapterUser, "id">
type UserByAccountInput = Pick<AdapterAccount, "provider" | "providerAccountId">
type UseVerificationTokenInput = Pick<VerificationToken, "identifier" | "token">

const adapter = {
  async createUser(user: CreateUserInput) {
    const [newUser] = await db.insert(users).values({
      email: user.email,
      displayName: user.name ?? null,
      username: user.email?.split("@")[0],
      avatar: user.image ?? null,
      provider: "credentials",
      emailVerified: user.emailVerified ?? null,
    }).returning()

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.displayName,
      username: newUser.username,
      image: newUser.avatar,
      emailVerified: newUser.emailVerified,
    }
  },

  async getUser(id: string) {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!user[0]) return null

    return {
      id: user[0].id,
      email: user[0].email,
      name: user[0].displayName,
      username: user[0].username,
      image: user[0].avatar,
      emailVerified: user[0].emailVerified,
      role: user[0].role,
    }
  },

  async getUserByEmail(email: string) {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!user[0]) return null

    return {
      id: user[0].id,
      email: user[0].email,
      name: user[0].displayName,
      username: user[0].username,
      image: user[0].avatar,
      emailVerified: user[0].emailVerified,
      role: user[0].role,
    }
  },

  async getUserByAccount({ providerAccountId, provider }: UserByAccountInput) {
    const account = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.providerAccountId, providerAccountId), eq(accounts.provider, provider)))
      .limit(1)

    if (!account[0]) return null

    const user = await db.select().from(users).where(eq(users.id, account[0].userId)).limit(1)
    if (!user[0]) return null

    return {
      id: user[0].id,
      email: user[0].email,
      name: user[0].displayName,
      username: user[0].username,
      image: user[0].avatar,
      emailVerified: user[0].emailVerified,
      role: user[0].role,
    }
  },

  async updateUser(user: UpdateUserInput) {
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: user.name ?? null,
        avatar: user.image ?? null,
        emailVerified: user.emailVerified ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning()

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.displayName,
      username: updatedUser.username,
      image: updatedUser.avatar,
      emailVerified: updatedUser.emailVerified,
      role: updatedUser.role,
    }
  },

  async deleteUser(userId: string) {
    await db.delete(users).where(eq(users.id, userId))
  },

  async linkAccount(account: AdapterAccount) {
    await db.insert(accounts).values({
      userId: account.userId,
      type: account.type,
      provider: account.provider,
      providerAccountId: account.providerAccountId,
      refresh_token: account.refresh_token,
      access_token: account.access_token,
      expires_at: account.expires_at,
      token_type: account.token_type,
      scope: account.scope,
      id_token: account.id_token,
      session_state: account.session_state,
    })
  },

  async unlinkAccount({ providerAccountId, provider }: UserByAccountInput) {
    await db
      .delete(accounts)
      .where(and(eq(accounts.providerAccountId, providerAccountId), eq(accounts.provider, provider)))
  },

  async createSession(session: AdapterSession) {
    const [newSession] = await db.insert(sessions).values({
      sessionToken: session.sessionToken,
      userId: session.userId,
      expires: session.expires,
    }).returning()

    return {
      sessionToken: newSession.sessionToken,
      userId: newSession.userId,
      expires: newSession.expires,
    }
  },

  async getSessionAndUser(sessionToken: string) {
    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionToken, sessionToken))
      .limit(1)

    if (!session[0]) return null

    const user = await db.select().from(users).where(eq(users.id, session[0].userId)).limit(1)
    if (!user[0]) return null

    return {
      session: session[0],
      user: {
        id: user[0].id,
        email: user[0].email,
        name: user[0].displayName,
        username: user[0].username,
        image: user[0].avatar,
        emailVerified: user[0].emailVerified,
        role: user[0].role,
      },
    }
  },

  async updateSession(session: AdapterSession) {
    const [updatedSession] = await db
      .update(sessions)
      .set({
        expires: session.expires,
        updatedAt: new Date(),
      })
      .where(eq(sessions.sessionToken, session.sessionToken))
      .returning()

    return {
      sessionToken: updatedSession.sessionToken,
      userId: updatedSession.userId,
      expires: updatedSession.expires,
    }
  },

  async deleteSession(sessionToken: string) {
    await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
  },

  async createVerificationToken(token: VerificationToken) {
    await db.insert(verificationTokens).values({
      identifier: token.identifier,
      token: token.token,
      expires: token.expires,
    })
  },

  async useVerificationToken({ identifier, token }: UseVerificationTokenInput) {
    const verificationToken = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token)))
      .limit(1)

    if (!verificationToken[0]) return null

    await db.delete(verificationTokens).where(eq(verificationTokens.token, token))

    return verificationToken[0]
  },
}

const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  adapter: adapter as Adapter,
  providers: [
    // GitHub Provider
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          username: profile.login,
        }
      },
    }),

    // Google Provider
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email?.split("@")[0],
        }
      },
    }),

    // Credentials Provider (for email/password)
    ...(devCredentialsEnabled()
      ? [
        Credentials({
          name: "credentials",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          async authorize(credentials) {
            const env = getServerEnv()

            // Dev credentials fallback
            if (env.NODE_ENV !== "production") {
              const { username: expectedUsername, password: expectedPassword } = getDevCredentials()
              const email = credentials?.email ?? ""
              const password = credentials?.password ?? ""

              if (email === expectedUsername && password === expectedPassword) {
                // Create or get dev user
                let user = await db.select().from(users).where(eq(users.email, email)).limit(1)

                if (!user[0]) {
                  user = await db.insert(users).values({
                    email,
                    displayName: "Dev Admin",
                    username: "admin",
                    role: "admin",
                    provider: "credentials",
                    isActive: true,
                  }).returning()
                }

                // Update login stats
                await db
                  .update(users)
                  .set({
                    lastLoginAt: new Date(),
                    loginCount: user[0].loginCount + 1,
                  })
                  .where(eq(users.id, user[0].id))

                return {
                  id: user[0].id,
                  name: user[0].displayName,
                  email: user[0].email,
                  role: user[0].role,
                }
              }
            }

            // Production email/password validation
            if (credentials?.email && credentials?.password) {
              const user = await db
                .select()
                .from(users)
                .where(eq(users.email, credentials.email))
                .limit(1)

              if (!user[0] || !user[0].password) return null

              const isValidPassword = await bcrypt.compare(credentials.password, user[0].password)
              if (!isValidPassword) return null

              if (!user[0].isActive) return null

              // Update login stats
              await db
                .update(users)
                .set({
                  lastLoginAt: new Date(),
                  loginCount: user[0].loginCount + 1,
                })
                .where(eq(users.id, user[0].id))

              return {
                id: user[0].id,
                name: user[0].displayName,
                email: user[0].email,
                role: user[0].role,
              }
            }

            return null
          },
        }),
      ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: Account | null }) {
      // Persist the OAuth access_token and user id to the token right after signin
      if (account && user) {
        token.accessToken = account.access_token
        token.id = user.id
        const role = (user as User & { role?: string }).role
        token.role = role ?? "user"
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log user activity
      if (user?.id) {
        await db.insert(userActivityLog).values({
          userId: user.id,
          action: "SIGN_IN",
          resource: "auth",
          resourceId: user.id,
          metadata: {
            provider: account?.provider,
            isNewUser: isNewUser || false,
          },
        })
      }
    },
    async signOut({ token }) {
      // Log user activity
      if (token?.id) {
        await db.insert(userActivityLog).values({
          userId: token.id as string,
          action: "SIGN_OUT",
          resource: "auth",
          resourceId: token.id as string,
        })
      }
    },
  },
}

export default authOptions

declare module "next-auth" {
  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
      username?: string | null
      role?: string
    }
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    username?: string | null
    role?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: string
    accessToken?: string
  }
}
