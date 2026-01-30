import "@/lib/server/only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { requireServerEnv } from "@/lib/env/server"

import * as schema from "./schema"

type Db = ReturnType<typeof drizzle>

type GlobalDbCache = {
  __afendaDb?: Db
}

const globalForDb = globalThis as unknown as GlobalDbCache

let cachedDb: Db | null = null

function createDb(): Db {
  const connectionString = requireServerEnv("DATABASE_URL")
  const client = postgres(connectionString, { prepare: false })
  return drizzle(client, { schema })
}

export function getDb(): Db {
  if (cachedDb) return cachedDb

  // In development, preserve a singleton across HMR to avoid exhausting connections.
  if (process.env.NODE_ENV !== "production") {
    cachedDb = globalForDb.__afendaDb ?? (globalForDb.__afendaDb = createDb())
    return cachedDb
  }

  cachedDb = createDb()
  return cachedDb
}

