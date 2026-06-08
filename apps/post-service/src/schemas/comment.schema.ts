import { z } from "zod"
import mongoose from "mongoose"

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), { message: "Invalid ObjectId" })

const mediaRefSchema = z.object({
  id: z.string(),
  type: z.enum(["image", "video"]),
})

export const createCommentSchema = z.object({
  content: z.string().min(1).max(280),
  parentCommentId: z.string().optional(),
  media: z.array(mediaRefSchema).optional(),
})

export type CreateCommentDTO = z.infer<typeof createCommentSchema>
