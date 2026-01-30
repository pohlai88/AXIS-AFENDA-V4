import { getPublicEnv } from "@/lib/env/public"

export const siteConfig = {
  name: getPublicEnv().NEXT_PUBLIC_SITE_NAME ?? "AFENDA",
  description:
    getPublicEnv().NEXT_PUBLIC_SITE_DESCRIPTION ??
    "Life is chaos, but work doesn't have to be.",
  appUrl: getPublicEnv().NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const

