export const routes = {
  home: () => "/",
  login: (opts?: { callbackUrl?: string }) => {
    if (!opts?.callbackUrl) return "/login"
    return `/login?callbackUrl=${encodeURIComponent(opts.callbackUrl)}`
  },
  components: () => "/components",
  app: {
    root: () => "/app",
    dashboard: () => "/app",
    tasks: () => "/app/tasks",
    modules: () => "/app/modules",
    moduleBySlug: (slug: string) => `/app/modules/${slug}`,
    approvals: () => "/app/approvals",
    settings: {
      root: () => "/app/settings",
      designSystem: () => "/app/settings/design-system",
    },
  },
  api: {
    me: () => "/api/v1/me",
    users: {
      byId: (id: string) => `/api/v1/users/${id}`,
    },
    tenant: {
      designSystem: () => "/api/v1/tenant/design-system",
    },
  },
} as const

