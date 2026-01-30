export const headerNames = {
  requestId: "x-request-id",
  tenantId: "x-tenant-id",
} as const

export type HeaderNameKey = keyof typeof headerNames
export type HeaderNameValue = (typeof headerNames)[HeaderNameKey]

