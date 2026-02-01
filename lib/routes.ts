export const routes = {
  home: () => "/",
  terms: () => "/terms",
  privacy: () => "/privacy",
  components: () => "/components",
  public: {
    login: () => "/login",
    register: () => "/register",
    forgotPassword: () => "/forgot-password",
    resetPassword: (token?: string) => token ? `/reset-password?token=${token}` : "/reset-password",
    /**
     * Dedicated callback landing page for Neon Auth redirects.
     * Keeps the UI consistent while the session finalizes.
     */
    authCallback: (next?: string) => next ? `/auth/callback?next=${encodeURIComponent(next)}` : "/auth/callback",
  },
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
      sessions: () => "/app/settings/sessions",
    },
  },
  organization: {
    root: () => "/organization",
    new: () => "/organization/new",
    byId: (id: string) => `/organization/${id}`,
    settings: (id: string) => `/organization/${id}/settings`,
    members: (id: string) => `/organization/${id}/members`,
    teams: (id: string) => `/organization/${id}/teams`,
  },
  teams: {
    root: () => "/teams",
    new: () => "/teams/new",
    byId: (id: string) => `/teams/${id}`,
    members: (id: string) => `/teams/${id}/members`,
    settings: (id: string) => `/teams/${id}/settings`,
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
    organizations: {
      list: () => "/api/v1/organizations",
      byId: (id: string) => `/api/v1/organizations/${id}`,
      members: (id: string) => `/api/v1/organizations/${id}/members`,
    },
    teams: {
      list: () => "/api/v1/teams",
      byId: (id: string) => `/api/v1/teams/${id}`,
      members: (id: string) => `/api/v1/teams/${id}/members`,
    },
    shares: {
      list: () => "/api/v1/shares",
      byId: (id: string) => `/api/v1/shares/${id}`,
    },
    sessions: {
      list: () => "/api/v1/sessions",
      byId: (id: string) => `/api/v1/sessions/${id}`,
    },
  },
} as const

