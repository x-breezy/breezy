import { MessageModel, ConversationModel } from "../models/message.model"
import type { Message, Conversation } from "../models/message.model"
import type { PaginatedResponse } from "../types/api"
import { getIO } from "../config/websocket"

export class ChatService {
  // ── Conversations ──────────────────────────────────────────

  async getOrCreateConversation(userIdA: string, userIdB: string): Promise<Conversation> {
    const participants = [userIdA, userIdB].sort() // ordre stable
    const existing = await ConversationModel.findOne({
      participantIds: { $all: participants, $size: 2 },
    }).exec()
    if (existing) return existing as unknown as Conversation

    return ConversationModel.create({
      participantIds: participants,
    }) as unknown as Promise<Conversation>
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return ConversationModel.find({ participantIds: userId })
      .sort({ lastMessageAt: -1 })
      .exec() as unknown as Promise<Conversation[]>
  }

  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participantIds: userId,
    }).exec()
    
    if (!conversation) return false
    
    await Promise.all([
      ConversationModel.findByIdAndDelete(conversationId).exec(),
      MessageModel.deleteMany({ conversationId }).exec()
    ])
    
    return true
  }

  // ── Messages ───────────────────────────────────────────────

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const [message, conversation] = await Promise.all([
      MessageModel.create({ conversationId, senderId, content }),
      ConversationModel.findByIdAndUpdate(conversationId, {
        lastMessage: content,
        lastMessageAt: new Date(),
      }).exec(),
    ])

    // Emit real-time notification to the recipient
    const recipientId = conversation?.participantIds.find((id) => id !== senderId)
    if (recipientId) {
      try {
        getIO().to(recipientId).emit("message:new", message)
      } catch (err) {
        // Ignore if IO is not initialized during tests or fails silently
      }
    }

    return message as unknown as Message
  }

  async getMessages(
    conversationId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<Message>> {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      MessageModel.find({ conversationId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      MessageModel.countDocuments({ conversationId }),
    ])
    return { data: data as unknown as Message[], total, page, limit }
  }

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await MessageModel.updateMany(
      { conversationId, senderId: { $ne: userId }, readAt: null },
      { readAt: new Date() }
    ).exec()
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const deleted = await MessageModel.findOneAndDelete({
      _id: messageId,
      senderId: userId, // seul l'auteur peut supprimer
    }).exec()
    return deleted !== null
  }
}

export default ChatService
