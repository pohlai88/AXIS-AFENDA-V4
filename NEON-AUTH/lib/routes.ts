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
      signOut: () => "/sign-out",
      accountSettings: () => "/account/settings",
      accountSecurity: () => "/account/security",
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
    magicfolder: {
      root: () => "/app/magicfolder",
      landing: () => "/app/magicfolder",
      inbox: () => "/app/magicfolder/inbox",
      duplicates: () => "/app/magicfolder/duplicates",
      unsorted: () => "/app/magicfolder/unsorted",
      search: () => "/app/magicfolder/search",
      collections: () => "/app/magicfolder/collections",
      documentById: (id: string) => `/app/magicfolder/documents/${id}`,
      audit: () => "/app/magicfolder/audit",
      settings: () => "/app/magicfolder/settings",
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
    analytics: {
      webVitals: () => "/api/analytics/web-vitals",
      pageView: () => "/api/analytics/page-view",
    },
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
      /** Activity/audit for current user (empty stack; ready for future use) */
      activity: () => "/api/auth/activity",
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
      auditHash: () => "/api/cron/audit-hash",
      processMagicfolderQueue: () => "/api/cron/process-magicfolder-queue",
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
      magicfolder: {
        upload: () => "/api/v1/magicfolder/upload",
        presign: () => "/api/v1/magicfolder/presign",
        ingest: () => "/api/v1/magicfolder/ingest",
        keepBest: () => "/api/v1/magicfolder/keep-best",
        list: () => "/api/v1/magicfolder",
        duplicateGroups: () => "/api/v1/magicfolder/duplicate-groups",
        duplicateGroupById: (id: string) => `/api/v1/magicfolder/duplicate-groups/${id}`,
        bulk: () => "/api/v1/magicfolder/bulk",
        objectById: (id: string) => `/api/v1/magicfolder/objects/${id}`,
        objectDuplicate: (id: string) => `/api/v1/magicfolder/objects/${id}/duplicate`,
        objectExport: (id: string) => `/api/v1/magicfolder/objects/${id}/export`,
        objectSourceUrl: (id: string) => `/api/v1/magicfolder/objects/${id}/source-url`,
        objectPreviewUrl: (id: string) => `/api/v1/magicfolder/objects/${id}/preview-url`,
        objectThumbUrl: (id: string, page?: number) =>
          page != null
            ? `/api/v1/magicfolder/objects/${id}/thumb-url?page=${page}`
            : `/api/v1/magicfolder/objects/${id}/thumb-url`,
        objectTags: (id: string) => `/api/v1/magicfolder/objects/${id}/tags`,
        tags: () => "/api/v1/magicfolder/tags",
        tagById: (id: string) => `/api/v1/magicfolder/tags/${id}`,
        health: () => "/api/v1/magicfolder/health",
        auditHash: () => "/api/v1/magicfolder/audit/hash",
        preferences: () => "/api/v1/magicfolder/preferences",
        savedViews: () => "/api/v1/magicfolder/saved-views",
        savedViewById: (id: string) => `/api/v1/magicfolder/saved-views/${id}`,
        tenantSettings: () => "/api/v1/magicfolder/tenant-settings",
      },
      storage: {
        presignUpload: () => "/api/v1/storage/presign-upload",
        saveMetadata: () => "/api/v1/storage/save-metadata",
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

