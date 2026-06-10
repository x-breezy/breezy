import { Schema, model } from "mongoose"

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  readAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface Conversation {
  id: string
  participantIds: string[]
  lastMessage: string | null
  lastMessageAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<Message>(
  {
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    content: { type: String, required: true, maxlength: 2000 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "messages" }
)

messageSchema.index({ conversationId: 1, createdAt: -1 })

const conversationSchema = new Schema<Conversation>(
  {
    participantIds: { type: [String], required: true, index: true },
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "conversations" }
)



export const MessageModel = model<Message>("Message", messageSchema)
export const ConversationModel = model<Conversation>("Conversation", conversationSchema)
