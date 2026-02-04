import "@/lib/server/only"

import { drizzle } from "drizzle-orm/postgres-js"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { requireServerEnv } from "@/lib/env/server"
import { Result, err, ok } from "@/lib/shared/result"

import * as schema from "./schema"

export type Db = PostgresJsDatabase<typeof schema>

type GlobalDbCache = {
  __afendaDb?: Db
  __afendaDbClient?: postgres.Sql
  __afendaRlsConfigPromise?: Promise<void>
}

const globalForDb = globalThis as unknown as GlobalDbCache

// Connection pool configuration
function readInt(name: string): number | undefined {
  const raw = process.env[name]
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : undefined
}

function readMs(name: string): number | undefined {
  const raw = process.env[name]
  if (!raw) return undefined
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/**
 * Neon best-practice defaults:
 * - Prefer low connection counts in serverless to avoid connection exhaustion.
 * - Tune via env vars when needed.
 */
const DB_CONFIG = {
  max: readInt("DB_POOL_MAX") ?? (process.env.NODE_ENV === "production" ? 5 : 20),
  idle_timeout: readInt("DB_POOL_IDLE_TIMEOUT") ?? 30, // seconds
  connect_timeout: readInt("DB_POOL_CONNECT_TIMEOUT") ?? 10, // seconds
  prepare: false, // postgres.js recommendation for serverless + compatibility
} as const

const SESSION_DEFAULTS = {
  applicationName: process.env.DB_APP_NAME ?? `afenda:${process.env.NODE_ENV ?? "unknown"}`,
  statementTimeoutMs: readMs("DB_STATEMENT_TIMEOUT_MS") ?? 30_000,
  lockTimeoutMs: readMs("DB_LOCK_TIMEOUT_MS") ?? 5_000,
  idleInTxTimeoutMs: readMs("DB_IDLE_IN_TX_TIMEOUT_MS") ?? 30_000,
} as const

export function getDbSessionDefaults() {
  return SESSION_DEFAULTS
}

let cachedDb: Db | null = null
let cachedClient: postgres.Sql | null = null

function createDb(): { db: Db; client: postgres.Sql } {
  const connectionString = requireServerEnv("DATABASE_URL")

  const sslRequired = /sslmode=require/i.test(connectionString)

  // Create connection pool
  const client = postgres(connectionString, {
    ...DB_CONFIG,
    connection: {
      application_name: SESSION_DEFAULTS.applicationName,
    },
    // Enable SSL when required by connection string or in production
    ssl: (sslRequired || process.env.NODE_ENV === "production") ? "require" : false,
  })

  const db = drizzle(client, {
    schema,
    // Enable logging in development
    logger: process.env.NODE_ENV === "development",
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
 * Export the database instance directly
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    return (getDb() as any)[prop]
  },
})

/**
 * Executes a database transaction with automatic rollback
 */
export async function withTransaction<T>(
  callback: (db: Db) => Promise<T>
): Promise<Result<T, Error>> {
  const client = getDbClient()

  try {
    const value = (await client.begin(async (tx) => {
      const defaults = getDbSessionDefaults()
      const txSql = tx as unknown as postgres.Sql
      await txSql`set local statement_timeout = ${defaults.statementTimeoutMs};`
      await txSql`set local lock_timeout = ${defaults.lockTimeoutMs};`
      await txSql`set local idle_in_transaction_session_timeout = ${defaults.idleInTxTimeoutMs};`

      // Create a new db instance with the transaction client
      const txDb = drizzle(txSql, { schema })
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

export type RlsHealth = {
  role: string
  rowSecurity: string | null
  tables: Array<{ table: string; rlsEnabled: boolean; rlsForced: boolean }>
  missingRlsOnTables: string[]
}

const RLS_TABLES_TO_ENFORCE = [
  "neon_user_profiles",
  "neon_organizations",
  "neon_teams",
  "neon_memberships",
  "neon_subdomain_config",
  "neon_projects",
  "neon_recurrence_rules",
  "neon_tasks",
  "neon_task_history",
] as const

/**
 * Validates that the runtime connection is suitable for RLS enforcement.
 *
 * Notes:
 * - This is only a *configuration* check (it does not validate per-user policies).
 * - If you connect as an owner/superuser, RLS can be bypassed; use `DB_ASSERT_RLS_ROLE=app_user`.
 */
export async function checkRlsHealth(): Promise<Result<RlsHealth, Error>> {
  const client = getDbClient()

  try {
    const metaRows = (await client`select current_user as role, current_setting('row_security', true) as row_security`) as unknown as Array<{
      role: string
      row_security: string | null
    }>
    const role = metaRows[0]?.role ?? "unknown"
    const rowSecurity = metaRows[0]?.row_security ?? null

    const rlsRows =
      (await client`
        select
          c.relname as "table",
          c.relrowsecurity as "rlsEnabled",
          c.relforcerowsecurity as "rlsForced"
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname in ${client([...RLS_TABLES_TO_ENFORCE])}
        order by c.relname asc
      `) as unknown as Array<{ table: string; rlsEnabled: boolean; rlsForced: boolean }>

    const missingRlsOnTables = RLS_TABLES_TO_ENFORCE.filter(
      (t) => !rlsRows.find((r) => r.table === t && r.rlsEnabled)
    )

    return ok({
      role,
      rowSecurity,
      tables: rlsRows,
      missingRlsOnTables: [...missingRlsOnTables],
    })
  } catch (e) {
    return err(e as Error)
  }
}

/**
 * Optional: fail-fast guard for production.
 *
 * Set `DB_ASSERT_RLS_TABLES=true` to ensure core tables have RLS enabled.
 * This is cached globally and runs at most once per process.
 */
export async function assertRlsConfiguredOnce(sql?: postgres.Sql): Promise<void> {
  const shouldAssert = process.env.DB_ASSERT_RLS_TABLES === "true"
  if (!shouldAssert) return

  const cache = globalForDb
  if (!cache.__afendaRlsConfigPromise) {
    cache.__afendaRlsConfigPromise = (async () => {
      void (sql ?? getDbClient()) // ensure a client exists
      const rls = await checkRlsHealth()
      if (!rls.ok) throw rls.error
      if (rls.value.missingRlsOnTables.length > 0) {
        throw new Error(
          `RLS misconfigured: missing RLS on tables: ${rls.value.missingRlsOnTables.join(", ")}`
        )
      }
    })()
  }

  await cache.__afendaRlsConfigPromise
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
