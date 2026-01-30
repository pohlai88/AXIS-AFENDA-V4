import "@/lib/server/only"

export const cacheTags = {
  user: (id: string) => `user:${id}`,
  tenant: (id: string) => `tenant:${id}`,
  approvals: (tenantId: string) => `approvals:${tenantId}`,
  approval: (id: string) => `approval:${id}`,
  tasks: (tenantId: string) => `tasks:${tenantId}`,
  task: (id: string) => `task:${id}`,
  tenantDesignSystem: (tenantId: string) => `tenant-design-system:${tenantId}`,
} as const

