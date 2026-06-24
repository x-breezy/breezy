import { Schema, model } from "mongoose"

export interface Conversation {
  id: string
  participantIds: string[]
  isGroup: boolean
  name: string | null
  lastMessage: string | null
  lastMessageSenderId: string | null
  lastMessageAt: Date | null
  deletedBy: string[]
  createdAt: Date
  updatedAt: Date
}

const conversationSchema = new Schema<Conversation>(
  {
    participantIds: { type: [String], required: true, index: true },
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: null },
    lastMessage: { type: String, default: null },
    lastMessageSenderId: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
    deletedBy: { type: [String], default: [] },
  },
  { timestamps: true, collection: "conversations" }
)

export const ConversationModel = model<Conversation>("Conversation", conversationSchema)
