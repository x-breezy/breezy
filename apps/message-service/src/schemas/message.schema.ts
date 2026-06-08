import { z } from "zod"
import mongoose from "mongoose"

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), { message: "Invalid ObjectId" })

export const createConversationSchema = z.object({
  recipientId: z.string().uuid({ message: "recipientId must be a valid UUID" }),
})
export type CreateConversationDTO = z.infer<typeof createConversationSchema>

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
})
export type SendMessageDTO = z.infer<typeof sendMessageSchema>
