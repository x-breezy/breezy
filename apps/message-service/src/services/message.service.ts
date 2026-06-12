import { MessageModel, ConversationModel } from "../models/message.model"
import type { Message, Conversation } from "../models/message.model"
import type { PaginatedResponse } from "../types/api"
import { getIO } from "../config/websocket"

export class ChatService {
  // ── Conversations ──────────────────────────────────────────

  async getOrCreateConversation(participantIds: string[], name?: string): Promise<Conversation> {
    const participants = [...participantIds].sort() // ordre stable
    const existing = await ConversationModel.findOne({
      participantIds: { $all: participants, $size: participants.length },
    }).exec()
    
    if (existing) {
      if (existing.deletedBy && existing.deletedBy.length > 0) {
        await ConversationModel.findByIdAndUpdate(existing._id, { deletedBy: [] }).exec()
        existing.deletedBy = []
      }
      return existing as unknown as Conversation
    }

    const isGroup = participants.length > 2 || !!name

    return ConversationModel.create({
      participantIds: participants,
      isGroup,
      name: name || null,
      deletedBy: [],
    }) as unknown as Promise<Conversation>
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const conversations = await ConversationModel.find({ 
      participantIds: userId,
      deletedBy: { $ne: userId }
    })
      .sort({ lastMessageAt: -1 })
      .lean()
      .exec() as any[]
      
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await MessageModel.countDocuments({
          conversationId: conv._id.toString(),
          senderId: { $ne: userId },
          readAt: null
        }).exec()
        return { ...conv, hasUnread: unreadCount > 0 }
      })
    )
    
    return withUnread as unknown as Promise<Conversation[]>
  }

  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participantIds: userId,
    }).exec()
    
    if (!conversation) return false
    
    if (conversation.isGroup) {
      const remainingParticipants = conversation.participantIds.filter((id) => id !== userId)
      
      if (remainingParticipants.length === 0) {
        await Promise.all([
          ConversationModel.findByIdAndDelete(conversationId).exec(),
          MessageModel.deleteMany({ conversationId }).exec()
        ])
      } else {
        const conversationUpdated = await ConversationModel.findByIdAndUpdate(conversationId, {
          participantIds: remainingParticipants
        }, { new: true }).exec()

        if (conversationUpdated) {
          const sysMsg = await MessageModel.create({
            conversationId,
            senderId: userId,
            content: "a quitté le groupe",
            isSystem: true
          })
          
          for (const recipientId of remainingParticipants) {
            try {
              getIO().to(recipientId).emit("message:new", sysMsg)
            } catch (err) {}
          }
        }
      }
    } else {
      const newDeletedBy = [...new Set([...(conversation.deletedBy || []), userId])]

      if (newDeletedBy.length >= conversation.participantIds.length) {
        // Everyone has soft-deleted it, we can safely hard-delete
        await Promise.all([
          ConversationModel.findByIdAndDelete(conversationId).exec(),
          MessageModel.deleteMany({ conversationId }).exec()
        ])
      } else {
        // Soft-delete for this user
        await ConversationModel.findByIdAndUpdate(conversationId, {
          deletedBy: newDeletedBy
        }).exec()
      }
    }
    
    return true
  }

  async renameConversation(conversationId: string, userId: string, name: string): Promise<Conversation | null> {
    const conversation = await ConversationModel.findOneAndUpdate(
      { _id: conversationId, participantIds: userId, isGroup: true },
      { name },
      { new: true }
    ).exec()

    if (conversation) {
      const sysMsg = await MessageModel.create({
        conversationId,
        senderId: userId,
        content: `a renommé le groupe en "${name}"`,
        isSystem: true
      })

      // Broadcast update and system message to participants
      const recipientIds = conversation.participantIds || []
      for (const recipientId of recipientIds) {
        try {
          getIO().to(recipientId).emit("conversation:updated", conversation)
          getIO().to(recipientId).emit("message:new", sysMsg)
        } catch (err) {}
      }
    }

    return conversation as unknown as Conversation | null
  }

  // ── Messages ───────────────────────────────────────────────

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const [message, conversation] = await Promise.all([
      MessageModel.create({ conversationId, senderId, content }),
      ConversationModel.findByIdAndUpdate(conversationId, {
        lastMessage: content,
        lastMessageAt: new Date(),
        deletedBy: [],
      }).exec(),
    ])

    // Emit real-time notification to all participants
    const recipientIds = conversation?.participantIds || []
    for (const recipientId of recipientIds) {
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
