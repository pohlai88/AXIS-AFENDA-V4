import { routes } from "@/lib/routes"

export const authRegistry = {
  domain: "auth",
  ui: {
    routes: [
      routes.ui.auth.login(),
      routes.ui.auth.register(),
      routes.ui.auth.forgotPassword(),
      routes.ui.auth.resetPassword(),
      routes.ui.auth.verifyEmail(),
      routes.ui.auth.authCallback(),
    ],
  },
  api: {
    routes: [
      // Framework/provider auth routes (unversioned)
      `${routes.api.auth.base()}/*`,

      // Versioned auth surface
      routes.api.v1.auth.me(),
      routes.api.v1.auth.users.byId(":id"),
      routes.api.v1.auth.sessions.list(),
      routes.api.v1.auth.sessions.byId(":id"),
    ],
  },
  dependsOn: ["shared"] as const,
} as const

