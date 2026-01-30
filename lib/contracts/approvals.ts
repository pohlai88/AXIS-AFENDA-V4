import { z } from "zod"

export const CreateApprovalSchema = z.object({
  title: z.string().min(1).max(200),
})

export type CreateApprovalInput = z.infer<typeof CreateApprovalSchema>

export const UpdateApprovalStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
})

export type UpdateApprovalStatusInput = z.infer<typeof UpdateApprovalStatusSchema>

