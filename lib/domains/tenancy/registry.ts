import { routes } from "@/lib/routes"

export const tenancyRegistry = {
  domain: "tenancy",
  ui: {
    routes: [
      routes.ui.tenancy.root(),
      routes.ui.tenancy.organizations.list(),
      routes.ui.tenancy.organizations.new(),
      routes.ui.tenancy.teams.list(),
      routes.ui.tenancy.teams.new(),
      routes.ui.tenancy.memberships.list(),
      routes.ui.tenancy.designSystem(),
    ],
  },
  api: {
    routes: [
      routes.api.v1.tenancy.organizations.list(),
      routes.api.v1.tenancy.organizations.byId(":id"),
      routes.api.v1.tenancy.teams.list(),
      routes.api.v1.tenancy.teams.byId(":id"),
      routes.api.v1.tenancy.tenant.designSystem(),
    ],
  },
  dependsOn: ["shared", "auth"] as const,
} as const

