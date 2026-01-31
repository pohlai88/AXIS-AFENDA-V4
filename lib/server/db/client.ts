import "@/lib/server/only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { requireServerEnv } from "@/lib/env/server"
import { Result, err, ok } from "@/lib/shared/result"

import * as schema from "./schema"

type Db = ReturnType<typeof drizzle>

type GlobalDbCache = {
  __afendaDb?: Db
  __afendaDbClient?: postgres.Sql
}

const globalForDb = globalThis as unknown as GlobalDbCache

// Connection pool configuration
const DB_CONFIG = {
  max: 20, // Maximum number of connections
  idle_timeout: 30, // Idle timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
  prepare: false, // Disable prepared statements for better performance
}

let cachedDb: Db | null = null
let cachedClient: postgres.Sql | null = null

function createDb(): { db: Db; client: postgres.Sql } {
  const connectionString = requireServerEnv("DATABASE_URL")

  // Create connection pool
  const client = postgres(connectionString, {
    ...DB_CONFIG,
    // Enable SSL in production
    ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  })

  const db = drizzle(client, {
    schema,
    // Enable logging in development
    logger: process.env.NODE_ENV === 'development',
  })

  return { db, client }
}

/**
 * Gets the database instance with connection pooling
 */
export function getDb(): Db {
  if (cachedDb && cachedClient) return cachedDb

  // In development, preserve a singleton across HMR to avoid exhausting connections.
  if (process.env.NODE_ENV !== "production") {
    if (!globalForDb.__afendaDb || !globalForDb.__afendaDbClient) {
      const { db, client } = createDb()
      globalForDb.__afendaDb = db
      globalForDb.__afendaDbClient = client
    }
    cachedDb = globalForDb.__afendaDb
    cachedClient = globalForDb.__afendaDbClient
    return cachedDb
  }

  // In production, create new instances but cache them
  const { db, client } = createDb()
  cachedDb = db
  cachedClient = client
  return cachedDb
}

/**
 * Gets the raw SQL client for custom queries
 */
export function getDbClient(): postgres.Sql {
  getDb() // Ensure client is created
  return cachedClient!
}

/**
 * Executes a database transaction with automatic rollback
 */
export async function withTransaction<T>(
  callback: (db: Db) => Promise<T>
): Promise<Result<T, Error>> {
  const client = getDbClient()

  try {
    const value = (await client.begin(async (tx) => {
      // Create a new db instance with the transaction client
      const txDb = drizzle(tx as unknown as postgres.Sql, { schema })
      return await callback(txDb)
    })) as unknown as T
    return ok(value)
  } catch (e) {
    return err(e as Error)
  }
}

/**
 * Health check for database connection
 */
export async function checkDbHealth(): Promise<Result<boolean, Error>> {
  const client = getDbClient()

  try {
    await client`SELECT 1`
    return ok(true)
  } catch (e) {
    return err(e as Error)
  }
}

/**
 * Gracefully closes database connections
 */
export async function closeDb(): Promise<void> {
  if (cachedClient) {
    await cachedClient.end()
    cachedClient = null
    cachedDb = null
  }

  if (globalForDb.__afendaDbClient) {
    await globalForDb.__afendaDbClient.end()
    globalForDb.__afendaDbClient = undefined
    globalForDb.__afendaDb = undefined
  }
}

// Graceful shutdown on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', closeDb)
  process.on('SIGTERM', closeDb)
  process.on('beforeExit', closeDb)
}
