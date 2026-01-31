import "@/lib/server/only"

/**
 * Database entrypoint.
 *
 * This module exists to provide a stable import path (`@/lib/server/db`)
 * for server-only DB access and helpers.
 */

export { getDb, getDbClient, withTransaction, checkDbHealth, closeDb } from "./client"
import { getDb } from "./client"

/**
 * Convenience singleton for most request-scoped usage.
 * `getDb()` is already internally cached (and HMR-safe in dev).
 */
export const db = getDb()

