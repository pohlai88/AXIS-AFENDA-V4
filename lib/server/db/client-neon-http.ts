import "@/lib/server/only"

/**
 * Neon Serverless (HTTP) + Drizzle client.
 *
 * Use this when deploying to serverless/edge runtimes to avoid connection pooling issues
 * (Neon recommends the serverless driver for these environments).
 *
 * Note:
 * - This is intentionally separate from `client.ts` to keep the default Node runtime path simple.
 * - You still use the same `DATABASE_URL`.
 */

import { drizzle } from "drizzle-orm/neon-http"

import { requireServerEnv } from "@/lib/env/server"

import * as schema from "./schema"

type DbHttp = ReturnType<typeof drizzle>

type GlobalDbHttpCache = {
  __afendaNeonHttpDbPromise?: Promise<DbHttp>
}

const globalForDb = globalThis as unknown as GlobalDbHttpCache

let cachedDbPromise: Promise<DbHttp> | null = null

async function createDb(): Promise<DbHttp> {
  const connectionString = requireServerEnv("DATABASE_URL")

  // Lazy import so Next can safely evaluate Edge routes during build.
  const { neon, neonConfig } = await import("@neondatabase/serverless")
  // Use runtime WebSocket when available (Edge + modern Node).
  if (typeof WebSocket !== "undefined") neonConfig.webSocketConstructor = WebSocket

  const sql = neon(connectionString)
  return drizzle(sql, { schema })
}

export function getDbHttp(): Promise<DbHttp> {
  if (cachedDbPromise) return cachedDbPromise

  // In development, preserve a singleton across HMR.
  if (process.env.NODE_ENV !== "production") {
    cachedDbPromise =
      globalForDb.__afendaNeonHttpDbPromise ??
      (globalForDb.__afendaNeonHttpDbPromise = createDb())
    return cachedDbPromise
  }

  cachedDbPromise = createDb()
  return cachedDbPromise
}

