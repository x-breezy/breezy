import { z } from "zod"

export const createCommentSchema = z.object({
  content: z.string().min(1).max(280),
  parentCommentId: z.string().optional(),
})

export type CreateCommentDTO = z.infer<typeof createCommentSchema>
