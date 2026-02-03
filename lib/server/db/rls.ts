import "@/lib/server/only"

import { drizzle } from "drizzle-orm/postgres-js"
import type postgres from "postgres"

import { assertRlsConfiguredOnce, getDbClient, getDbSessionDefaults, type Db } from "@/lib/server/db/client"
import * as schema from "@/lib/server/db/schema"

export type RlsContext = {
  userId: string
  organizationId?: string | null
  teamId?: string | null
}

export async function withRlsDbEx<T>(
  ctx: RlsContext,
  fn: (db: Db, sql: postgres.Sql) => Promise<T>
): Promise<T> {
  if (!ctx.userId) {
    throw new Error("withRlsDbEx requires a userId")
  }

  const client = getDbClient()

  const value = (await client.begin(async (tx) => {
    const txSql = tx as unknown as postgres.Sql

    await assertRlsConfiguredOnce(txSql)

    const defaults = getDbSessionDefaults()
    // Neon pooler-safe: apply timeouts transaction-locally (avoid startup packet options).
    await txSql`set local statement_timeout = ${defaults.statementTimeoutMs};`
    await txSql`set local lock_timeout = ${defaults.lockTimeoutMs};`
    await txSql`set local idle_in_transaction_session_timeout = ${defaults.idleInTxTimeoutMs};`

    const expectedRole = process.env.DB_ASSERT_RLS_ROLE
    if (expectedRole) {
      const rows = (await txSql`select current_user as role`) as unknown as Array<{ role: string }>
      if (rows[0]?.role !== expectedRole) {
        throw new Error(
          `RLS role assertion failed: expected ${expectedRole}, got ${rows[0]?.role ?? "unknown"}`
        )
      }
    }

    // Transaction-local session setting.
    await txSql`select set_config('app.user_id', ${ctx.userId}, true);`

    // Optional tenant context (for future RLS policies / auditing).
    if (ctx.organizationId !== undefined) {
      await txSql`select set_config('app.organization_id', ${ctx.organizationId ?? ""}, true);`
    }
    if (ctx.teamId !== undefined) {
      await txSql`select set_config('app.team_id', ${ctx.teamId ?? ""}, true);`
    }

    const txDb = drizzle(txSql, { schema })
    return await fn(txDb, txSql)
  })) as unknown as T

  return value
}

/**
 * Run queries with request-scoped RLS context.
 *
 * This sets `app.user_id` for the duration of the transaction so Postgres RLS policies
 * can safely reference `current_setting('app.user_id', true)`.
 *
 * IMPORTANT:
 * - For RLS to be enforced, the application MUST connect using a non-owner role (recommended: `app_user`).
 * - Optional safety: set `DB_ASSERT_RLS_ROLE=app_user` to fail-fast if the connection role is wrong.
 * - Always keep DB work inside the callback so it uses the same transaction connection.
 */
export async function withRlsDb<T>(userId: string, fn: (db: Db) => Promise<T>): Promise<T>
export async function withRlsDb<T>(ctx: RlsContext, fn: (db: Db) => Promise<T>): Promise<T>
export async function withRlsDb<T>(
  userIdOrCtx: string | RlsContext,
  fn: (db: Db) => Promise<T>
): Promise<T> {
  const ctx: RlsContext =
    typeof userIdOrCtx === "string" ? { userId: userIdOrCtx } : userIdOrCtx

  return await withRlsDbEx(ctx, async (db) => await fn(db))
}

