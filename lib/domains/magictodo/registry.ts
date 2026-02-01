import { routes } from "@/lib/routes"

export const magictodoRegistry = {
  domain: "magictodo",
  ui: {
    routes: [routes.ui.magictodo.tasks(), routes.ui.magictodo.projects()],
  },
  api: {
    routes: [
      routes.api.v1.magictodo.tasks.list(),
      routes.api.v1.magictodo.tasks.byId(":id"),
      routes.api.v1.magictodo.tasks.filter(),
      routes.api.v1.magictodo.projects.list(),
      routes.api.v1.magictodo.projects.byId(":id"),
    ],
  },
  dependsOn: ["shared", "auth", "tenancy"] as const,
} as const

