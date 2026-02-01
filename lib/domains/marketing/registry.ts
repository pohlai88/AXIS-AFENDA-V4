import { routes } from "@/lib/routes"

export const marketingRegistry = {
  domain: "marketing",
  ui: {
    routes: [
      routes.ui.marketing.home(),
      routes.ui.marketing.terms(),
      routes.ui.marketing.privacy(),
      routes.ui.marketing.security(),
      routes.ui.marketing.infrastructure(),
      routes.ui.marketing.components(),
      routes.ui.marketing.offline(),
    ],
  },
  api: {
    routes: [],
  },
  dependsOn: ["shared"] as const,
} as const

