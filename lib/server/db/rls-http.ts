import "@/lib/server/only"

import type { NeonQueryFunctionInTransaction, NeonQueryInTransaction } from "@neondatabase/serverless"

import { getSqlHttp } from "@/lib/server/db/client-neon-http"

export type RlsHttpContext = {
  userId: string
  organizationId?: string | null
  teamId?: string | null
}

type TxnSql = NeonQueryFunctionInTransaction<boolean, boolean>
type BuiltQuery = NeonQueryInTransaction | NeonQueryInTransaction[]

/**
 * Run a single non-interactive HTTP transaction with RLS context set via `set_config`.
 *
 * This is intended for Edge/serverless usage with `@neondatabase/serverless` (HTTP driver),
 * where we can batch multiple statements in one request using `sql.transaction(...)`.
 *
 * Notes:
 * - The callback must be synchronous and return a single query (or list of queries) built from `txn`.
 * - The returned value is the result of the *last* query you provide.
 */
export async function withRlsHttp<T>(
  ctx: RlsHttpContext,
  build: (txn: TxnSql) => BuiltQuery
): Promise<T> {
  if (!ctx.userId) {
    throw new Error("withRlsHttp requires a userId")
  }

  const sql = await getSqlHttp()

  const results = await sql.transaction((txn) => {
    const queries: NeonQueryInTransaction[] = []
    queries.push(txn`select set_config('app.user_id', ${ctx.userId}, true)`)
    if (ctx.organizationId !== undefined) {
      queries.push(txn`select set_config('app.organization_id', ${ctx.organizationId ?? ""}, true)`)
    }
    if (ctx.teamId !== undefined) {
      queries.push(txn`select set_config('app.team_id', ${ctx.teamId ?? ""}, true)`)
    }

    const built = build(txn)
    if (Array.isArray(built)) {
      queries.push(...built)
    } else {
      queries.push(built)
    }
    return queries
  })

  return results[results.length - 1] as T
}

