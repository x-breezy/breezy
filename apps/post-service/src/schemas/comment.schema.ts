import { z } from "zod"
import mongoose from "mongoose"

export const objectIdSchema = z.string().refine(
  (val) => mongoose.isValidObjectId(val),
  { message: "Invalid ObjectId" }
)

export const createCommentSchema = z.object({
  content: z.string().min(1).max(280),
  parentCommentId: z.string().optional(),
})

export type CreateCommentDTO = z.infer<typeof createCommentSchema>
