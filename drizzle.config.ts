import { defineConfig } from "drizzle-kit"
import { loadEnvConfig } from "@next/env"

loadEnvConfig(process.cwd())

export default defineConfig({
  schema: "./lib/server/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: (() => {
      const url = process.env.DATABASE_URL
      if (!url) {
        throw new Error(
          "DATABASE_URL is required for drizzle-kit. Set it in .env.local (recommended) or your shell env."
        )
      }
      return url
    })(),
  },
  // Keep `push` non-interactive by default.
  strict: false,
})

