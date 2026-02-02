/**
 * @domain orchestra
 * @layer api
 * @responsibility API route handler for /api/test-env
 */

import "@/lib/server/only"

import { ok } from "@/lib/server/api/response"

export const runtime = "edge"

export async function GET() {
  return ok({
    NODE_ENV: process.env.NODE_ENV || "NOT_SET",
    // NOTE: Auth-related env vars are managed by Neon Auth during migration.
    timestamp: new Date().toISOString()
  })
}

