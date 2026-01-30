import { getPublicEnv } from "@/lib/env/public"

export const siteConfig = {
  name: "AFENDA",
  description: "Life is chaos, but work doesn't have to be.",
  appUrl: getPublicEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const

