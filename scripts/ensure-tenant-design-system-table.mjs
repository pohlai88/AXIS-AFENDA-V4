import fs from "node:fs"
import path from "node:path"
import process from "node:process"

function readDatabaseUrlFromEnvLocal() {
  const envLocalPath = path.join(process.cwd(), ".env.local")
  const raw = fs.readFileSync(envLocalPath, "utf8")
  const line = raw
    .split(/\r?\n/)
    .find((l) => l.trim().length > 0 && !l.trim().startsWith("#") && l.startsWith("DATABASE_URL="))

  if (!line) {
    throw new Error("DATABASE_URL not found in .env.local")
  }

  return line.replace(/^DATABASE_URL=/, "").trim()
}

const databaseUrl = process.env.DATABASE_URL || readDatabaseUrlFromEnvLocal()

const postgres = (await import("postgres")).default
const sql = postgres(databaseUrl, {
  // Keep connections short-lived for one-off scripts.
  max: 1,
  idle_timeout: 5,
})

try {
  await sql`
    CREATE TABLE IF NOT EXISTS tenant_design_system (
      tenant_id text PRIMARY KEY,
      settings jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    );
  `

  const [{ regclass }] = await sql`SELECT to_regclass('public.tenant_design_system') as regclass;`
  if (!regclass) throw new Error("Failed to create tenant_design_system table")

  console.log("OK: tenant_design_system table is present")
} finally {
  await sql.end({ timeout: 5 })
}

