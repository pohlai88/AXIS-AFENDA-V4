export const routes = {
  home: () => "/",
  login: (opts?: { callbackUrl?: string }) => {
    if (!opts?.callbackUrl) return "/login"
    return `/login?callbackUrl=${encodeURIComponent(opts.callbackUrl)}`
  },
  register: () => "/register",
  components: () => "/components",
  app: {
    root: () => "/app",
    dashboard: () => "/app",
    tasks: () => "/app/tasks",
    projects: () => "/app/projects",
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
    tasks: {
      list: () => "/api/v1/tasks",
      byId: (id: string) => `/api/v1/tasks/${id}`,
    },
    projects: {
      list: () => "/api/v1/projects",
      byId: (id: string) => `/api/v1/projects/${id}`,
    },
    approvals: {
      list: () => "/api/v1/approvals",
      byId: (id: string) => `/api/v1/approvals/${id}`,
    },
    tenant: {
      designSystem: () => "/api/v1/tenant/design-system",
    },
  },
} as const

