import "@/lib/server/only"

/**
 * Database entrypoint.
 *
 * This module exists to provide a stable import path (`@/lib/server/db`)
 * for server-only DB access and helpers.
 */

export { getDb, getDbClient, withTransaction, checkDbHealth, closeDb } from "./client"
export { checkRlsHealth } from "./client"

