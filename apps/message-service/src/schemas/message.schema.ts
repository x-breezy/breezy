import { z } from "zod"
import mongoose from "mongoose"

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.isValidObjectId(val), { message: "Invalid ObjectId" })

export const createConversationSchema = z
  .object({
    recipientId: z.string().uuid({ message: "recipientId must be a valid UUID" }).optional(),
    recipientIds: z
      .array(z.string().uuid({ message: "Each recipientId must be a valid UUID" }))
      .optional(),
    name: z.string().optional(),
  })
  .refine((data) => data.recipientId || (data.recipientIds && data.recipientIds.length > 0), {
    message: "Either recipientId or recipientIds must be provided",
  })
export type CreateConversationDTO = z.infer<typeof createConversationSchema>

export const replyToSchema = z.object({
  _id: z.string(),
  content: z.string(),
  senderName: z.string(),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  replyTo: replyToSchema.optional(),
})
export type SendMessageDTO = z.infer<typeof sendMessageSchema>

export const renameConversationSchema = z.object({
  name: z.string().min(1).max(100),
})
export type RenameConversationDTO = z.infer<typeof renameConversationSchema>

export const addMembersSchema = z.object({
  memberIds: z.array(z.string().uuid({ message: "Each memberId must be a valid UUID" })).min(1),
})
export type AddMembersDTO = z.infer<typeof addMembersSchema>
