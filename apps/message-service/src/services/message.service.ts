import { MessageModel } from "../models/message.model"
import type { Message, ReplyTo } from "../models/message.model"
import { ConversationModel } from "../models/conversation.model"
import type { PaginatedResponse } from "../types/api"
import { getIO } from "../config/websocket"
import { publish } from "../clients/rabbitmq"

export class MessageService {
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyTo?: ReplyTo
  ): Promise<Message> {
    const safeContent = typeof content === "string" ? content : String(content)
    const safeSenderId = typeof senderId === "string" ? senderId : String(senderId)
    const [message, conversation] = await Promise.all([
      MessageModel.create({
        conversationId,
        senderId: safeSenderId,
        content: safeContent,
        replyTo,
      }),
      ConversationModel.findByIdAndUpdate(conversationId, {
        lastMessage: safeContent,
        lastMessageSenderId: safeSenderId,
        lastMessageAt: new Date(),
        deletedBy: [],
      }).exec(),
    ])

    const participantIds = conversation?.participantIds || []
    for (const recipientId of participantIds) {
      try {
        getIO().to(recipientId).emit("message:new", message)
      } catch (err) {}
    }

    const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL ?? "http://localhost:4010"
    let senderUsername = safeSenderId
    try {
      const profileRes = await fetch(`${PROFILE_SERVICE_URL}/api/profiles/internal/${safeSenderId}`)
      if (profileRes.ok) {
        const profileBody = (await profileRes.json()) as { data?: { username?: string } }
        senderUsername = profileBody.data?.username ?? safeSenderId
      }
    } catch {}

    for (const recipientId of participantIds) {
      if (recipientId !== safeSenderId) {
        void publish("message.sent", {
          senderId: safeSenderId,
          senderUsername,
          recipientUserId: recipientId,
          content: safeContent,
          conversationId,
        })
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
      senderId: userId,
    }).exec()
    return deleted !== null
  }
}

export default MessageService
