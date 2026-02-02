export const routes = {
  ui: {
    marketing: {
      home: () => "/",
      terms: () => "/terms",
      privacy: () => "/privacy",
      security: () => "/security",
      infrastructure: () => "/infrastructure",
      components: () => "/components",
      offline: () => "/offline",
    },
    auth: {
      login: () => "/login",
      register: () => "/register",
      forgotPassword: () => "/forgot-password",
      resetPassword: (token?: string) =>
        token ? `/reset-password?token=${token}` : "/reset-password",
      verifyEmail: () => "/verify-email",
      /**
       * Dedicated callback landing page for Neon Auth redirects.
       * Keeps the UI consistent while the session finalizes.
       */
      authCallback: (next?: string) =>
        next
          ? `/auth/callback?next=${encodeURIComponent(next)}`
          : "/auth/callback",
    },
    orchestra: {
      root: () => "/app",
      dashboard: () => "/app",
      modules: () => "/app/modules",
      moduleBySlug: (slug: string) => `/app/modules/${slug}`,
      analytics: () => "/app/analytics",
      approvals: () => "/app/approvals",
    },
    magictodo: {
      tasks: () => "/app/tasks",
      projects: () => "/app/projects",
    },
    tenancy: {
      root: () => "/app/tenancy",
      organizations: {
        list: () => "/app/tenancy/organizations",
        new: () => "/app/tenancy/organizations/new",
        byId: (id: string) => `/app/tenancy/organizations/${id}`,
        settings: (id: string) => `/app/tenancy/organizations/${id}/settings`,
        members: (id: string) => `/app/tenancy/organizations/${id}/members`,
        teams: (id: string) => `/app/tenancy/organizations/${id}/teams`,
      },
      teams: {
        list: () => "/app/tenancy/teams",
        new: () => "/app/tenancy/teams/new",
        byId: (id: string) => `/app/tenancy/teams/${id}`,
        settings: (id: string) => `/app/tenancy/teams/${id}/settings`,
        members: (id: string) => `/app/tenancy/teams/${id}/members`,
      },
      memberships: {
        list: () => "/app/tenancy/memberships",
      },
      designSystem: () => "/app/tenancy/design-system",
    },
    settings: {
      root: () => "/app/settings",
      designSystem: () => "/app/settings/design-system",
      sessions: () => "/app/settings/sessions",
    },
  },
  api: {
    /**
     * Public auth feature endpoints (mirrors UI route names).
     *
     * NOTE: These are intentionally NOT nested under `/api/auth/*` so that
     * feature APIs live “with” the feature concept (forgot-password, reset-password, verify-email).
     * They still delegate to Neon Auth via `auth.handler()` internally.
     */
    publicAuth: {
      forgotPassword: () => "/api/forgot-password",
      resetPassword: () => "/api/reset-password",
      verifyEmail: () => "/api/verify-email",
      verifyEmailSend: () => "/api/verify-email/send",
      verifyEmailResend: () => "/api/verify-email/resend",
    },
    auth: {
      base: () => "/api/auth",
      /**
       * Provider auth catch-all route handler.
       * - Implementation: `app/api/auth/(auth)/[...path]/route.ts`
       * - Note: Registry uses `*` to represent arbitrary subpaths.
       */
      any: () => "/api/auth/*",
      getSession: () => "/api/auth/get-session",
      refresh: () => "/api/auth/refresh",
      logout: () => "/api/auth/logout",
      unlock: () => "/api/auth/unlock",
      internal: {
        refreshSession: () => "/api/auth/refresh-session",
        email: {
          resendCode: () => "/api/auth/email/resend-code",
          sendCode: () => "/api/auth/email/send-code",
          verify: () => "/api/auth/email/verify",
        },
        password: {
          reset: () => "/api/auth/password/reset",
          verifyResetToken: () => "/api/auth/password/verify-reset-token",
          resetPassword: () => "/api/auth/password/reset-password",
        },
      },
    },
    cron: {
      generateRecurrence: () => "/api/cron/generate-recurrence",
    },
    admin: {
      unlockAccount: () => "/api/admin/unlock-account",
    },
    internal: {
      /**
       * Minimal internal env probe used for debugging.
       * Keep it registered even if it stays internal.
       */
      testEnv: () => "/api/test-env",
    },
    orchestra: {
      analytics: () => "/api/orchestra/analytics",
      analyticsQuickStats: () => "/api/orchestra/analytics/quick-stats",
      analyticsInsights: () => "/api/orchestra/analytics/insights",
      approvals: {
        list: () => "/api/orchestra/approvals",
        byId: (id: string) => `/api/orchestra/approvals/${id}`,
      },
    },
    debug: {
      neonAuth: () => "/api/debug/neon-auth",
      neonConfig: () => "/api/debug/neon-config",
    },
    v1: {
      auth: {
        me: () => "/api/v1/me",
        users: {
          byId: (id: string) => `/api/v1/users/${id}`,
        },
        sessions: {
          list: () => "/api/v1/sessions",
          byId: (id: string) => `/api/v1/sessions/${id}`,
        },
      },
      magictodo: {
        tasks: {
          list: () => "/api/v1/tasks",
          byId: (id: string) => `/api/v1/tasks/${id}`,
          filter: () => "/api/v1/tasks/filter",
        },
        projects: {
          list: () => "/api/v1/projects",
          byId: (id: string) => `/api/v1/projects/${id}`,
        },
      },
      tenancy: {
        tenant: {
          designSystem: () => "/api/v1/tenant/design-system",
        },
        organizations: {
          list: () => "/api/v1/organizations",
          byId: (id: string) => `/api/v1/organizations/${id}`,
        },
        teams: {
          list: () => "/api/v1/teams",
          byId: (id: string) => `/api/v1/teams/${id}`,
        },
        subdomains: {
          list: () => "/api/subdomains",
          create: () => "/api/subdomains",
          update: () => "/api/subdomains",
          delete: () => "/api/subdomains",
        },
      },
    },
  },
} as const

