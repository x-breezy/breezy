import { z } from "zod"

export const createReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: z.string().min(1).max(1000),
})
export type CreateReportDTO = z.infer<typeof createReportSchema>

export const reportIdParamSchema = z.object({
  id: z.string().uuid(),
})
