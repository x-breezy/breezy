import { Schema, model } from "mongoose"

export interface ReplyTo {
  _id: string
  content: string
  senderName: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  isSystem?: boolean
  replyTo?: ReplyTo
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const replyToSchema = new Schema<ReplyTo>(
  {
    _id: { type: String, required: true },
    content: { type: String, required: true },
    senderName: { type: String, required: true },
  },
  { _id: false }
)

const messageSchema = new Schema<Message>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
    isSystem: { type: Boolean, default: false },
    replyTo: { type: replyToSchema, default: undefined },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "messages" }
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

export const MessageModel = model<Message>("Message", messageSchema)
