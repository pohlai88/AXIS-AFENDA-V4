export const endpoints = {
  me: () => "/api/v1/me",
  users: {
    byId: (id: string) => `/api/v1/users/${id}`,
  },
  approvals: {
    list: () => "/api/v1/approvals",
    byId: (id: string) => `/api/v1/approvals/${id}`,
  },
} as const

