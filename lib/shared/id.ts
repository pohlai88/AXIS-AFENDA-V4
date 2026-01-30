import { z } from "zod"

export const IdSchema = z.string().min(1)
export type Id = z.infer<typeof IdSchema>

export const TenantIdSchema = IdSchema
export type TenantId = z.infer<typeof TenantIdSchema>

