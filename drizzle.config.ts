import { defineConfig } from "drizzle-kit"

export default defineConfig({
  schema: "./lib/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // Keep `push` non-interactive by default.
  strict: false,
})

