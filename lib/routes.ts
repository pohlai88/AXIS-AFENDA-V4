export const routes = {
  home: () => "/",
  terms: () => "/terms",
  privacy: () => "/privacy",
  otp: () => "/otp",
  login: (opts?: { callbackUrl?: string }) => {
    if (!opts?.callbackUrl) return "/login"
    return `/login?callbackUrl=${encodeURIComponent(opts.callbackUrl)}`
  },
  register: () => "/register",
  forgotPassword: () => "/forgot-password",
  resetPassword: (opts?: { email?: string }) => {
    if (!opts?.email) return "/reset-password"
    return `/reset-password?email=${encodeURIComponent(opts.email)}`
  },
  components: () => "/components",
  app: {
    root: () => "/app",
    dashboard: () => "/app",
    tasks: () => "/app/tasks",
    projects: () => "/app/projects",
    analytics: () => "/app/analytics",
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
      filter: () => "/api/v1/tasks/filter",
    },
    projects: {
      list: () => "/api/v1/projects",
      byId: (id: string) => `/api/v1/projects/${id}`,
    },
    analytics: () => "/api/v1/analytics",
    approvals: {
      list: () => "/api/v1/approvals",
      byId: (id: string) => `/api/v1/approvals/${id}`,
    },
    tenant: {
      designSystem: () => "/api/v1/tenant/design-system",
    },
  },
} as const

