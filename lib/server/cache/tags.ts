import "@/lib/server/only"

export const cacheTags = {
  user: (id: string) => `user:${id}`,
  tenant: (id: string) => `tenant:${id}`,
  approvals: (tenantId: string) => `approvals:${tenantId}`,
  approval: (id: string) => `approval:${id}`,
} as const

