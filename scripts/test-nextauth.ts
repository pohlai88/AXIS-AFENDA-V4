#!/usr/bin/env node

/**
 * NextAuth Runtime Smoke Test
 *
 * Keeps `pnpm typecheck` green by being valid TS,
 * and provides a lightweight HTTP smoke test for common endpoints.
 *
 * Usage (optional):
 *   node --enable-source-maps ./scripts/test-nextauth.ts
 *
 * Notes:
 * - This repo's `typecheck` does not emit; this file mainly exists to typecheck.
 * - For static validation, see `scripts/validate-nextauth.ts`.
 */

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

type HttpResult = {
  ok: boolean
  status: number
  url: string
  bodyText: string
  json?: Json
}

async function httpGet(url: string): Promise<HttpResult> {
  const res = await fetch(url, { method: "GET" })
  const bodyText = await res.text()
  let json: Json | undefined
  try {
    json = JSON.parse(bodyText) as Json
  } catch {
    // ignore
  }
  return { ok: res.ok, status: res.status, url: res.url, bodyText, json }
}

async function main() {
  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000"
  const endpoints = [
    "/api/auth/csrf",
    "/api/test-session",
    "/api/test-env",
    "/login",
  ]

  console.log(`NextAuth smoke test against ${baseUrl}`)

  for (const path of endpoints) {
    const url = `${baseUrl}${path}`
    const r = await httpGet(url)
    const summary = r.ok ? "OK" : "FAIL"

    console.log(`[${summary}] ${r.status} ${path}`)
  }
}

main().catch((e) => {
  console.error("NextAuth smoke test failed:", e)
  process.exitCode = 1
})
