export const routes = {
  home: () => "/",
  components: () => "/components",
  api: {
    me: () => "/api/v1/me",
    users: {
      byId: (id: string) => `/api/v1/users/${id}`,
    },
  },
} as const

