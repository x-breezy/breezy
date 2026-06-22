import { Schema, model } from "mongoose"

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  isSystem?: boolean
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<Message>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
    isSystem: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "messages" }
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

export const MessageModel = model<Message>("Message", messageSchema)
