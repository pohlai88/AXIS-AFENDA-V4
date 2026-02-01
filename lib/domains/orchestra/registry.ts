import { routes } from "@/lib/routes"

export const orchestraRegistry = {
  domain: "orchestra",
  ui: {
    routes: [
      routes.ui.orchestra.root(),
      routes.ui.orchestra.modules(),
      routes.ui.orchestra.analytics(),
      routes.ui.orchestra.approvals(),
    ],
  },
  api: {
    routes: [
      routes.api.orchestra.analytics(),
      `${routes.api.orchestra.analytics()}/quick-stats`,
      `${routes.api.orchestra.analytics()}/insights`,
      routes.api.orchestra.approvals.list(),
      routes.api.orchestra.approvals.byId(":id"),
    ],
  },
  dependsOn: ["shared", "auth", "tenancy"] as const,
} as const

