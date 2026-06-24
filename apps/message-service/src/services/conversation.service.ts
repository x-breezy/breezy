import { ConversationModel } from "../models/conversation.model"
import type { Conversation } from "../models/conversation.model"
import { MessageModel } from "../models/message.model"
import { getIO } from "../config/websocket"

export interface ParticipantProfile {
  firstName: string | null
  lastName: string | null
  username: string | null
  avatarId: string | null
  role: string | null
}

async function fetchParticipantProfiles(
  ids: string[]
): Promise<Record<string, ParticipantProfile>> {
  if (ids.length === 0) return {}
  const url = `${process.env.PROFILE_SERVICE_URL ?? "http://localhost:4010"}/profiles/internal/batch?ids=${ids.join(",")}`
  try {
    const res = await fetch(url)
    if (!res.ok) return {}
    const json = await res.json()
    const profiles: any[] = json.data ?? []
    return Object.fromEntries(
      profiles.map((p) => [
        p.profileId,
        {
          firstName: p.firstName ?? null,
          lastName: p.lastName ?? null,
          username: p.username ?? null,
          avatarId: p.avatarId ?? null,
          role: p.role ?? null,
        },
      ])
    )
  } catch {
    return {}
  }
}

export class ConversationService {
  async getOrCreateConversation(participantIds: string[], name?: string): Promise<Conversation> {
    const participants = [...participantIds].sort()
    const isGroup = participants.length > 2 || !!name

    if (!isGroup) {
      const existing = await ConversationModel.findOne({
        participantIds: { $all: participants, $size: participants.length },
        isGroup: false,
      }).exec()

      if (existing) {
        if (existing.deletedBy && existing.deletedBy.length > 0) {
          await ConversationModel.findByIdAndUpdate(existing._id, { deletedBy: [] }).exec()
          existing.deletedBy = []
        }
        return existing as unknown as Conversation
      }
    }

    return ConversationModel.create({
      participantIds: participants,
      isGroup,
      name: name || null,
      deletedBy: [],
    }) as unknown as Promise<Conversation>
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    const conversations = (await ConversationModel.find({
      participantIds: userId,
      deletedBy: { $ne: userId },
    })
      .sort({ lastMessageAt: -1 })
      .lean()
      .exec()) as any[]

    const allParticipantIds = [
      ...new Set(conversations.flatMap((c) => c.participantIds as string[])),
    ]
    const [withUnread, participants] = await Promise.all([
      Promise.all(
        conversations.map(async (conv) => {
          const unreadCount = await MessageModel.countDocuments({
            conversationId: conv._id.toString(),
            senderId: { $ne: userId },
            readAt: null,
          }).exec()
          return { ...conv, hasUnread: unreadCount > 0, unreadCount }
        })
      ),
      fetchParticipantProfiles(allParticipantIds),
    ])

    return withUnread.map((conv) => ({ ...conv, participants })) as unknown as Conversation[]
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
          MessageModel.deleteMany({ conversationId }).exec(),
        ])
      } else {
        const conversationUpdated = await ConversationModel.findByIdAndUpdate(
          conversationId,
          { participantIds: remainingParticipants },
          { new: true }
        ).exec()

        if (conversationUpdated) {
          const sysMsg = await MessageModel.create({
            conversationId,
            senderId: userId,
            content: "a quitté le groupe",
            isSystem: true,
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
        await Promise.all([
          ConversationModel.findByIdAndDelete(conversationId).exec(),
          MessageModel.deleteMany({ conversationId }).exec(),
        ])
      } else {
        await ConversationModel.findByIdAndUpdate(conversationId, {
          deletedBy: newDeletedBy,
        }).exec()
      }
    }

    return true
  }

  async renameConversation(
    conversationId: string,
    userId: string,
    name: string
  ): Promise<Conversation | null> {
    const safeName = typeof name === "string" ? name : String(name)
    const conversation = await ConversationModel.findOneAndUpdate(
      { _id: conversationId, participantIds: userId, isGroup: true },
      { name: safeName },
      { new: true }
    ).exec()

    if (conversation) {
      const sysMsg = await MessageModel.create({
        conversationId,
        senderId: userId,
        content: `a renommé le groupe en "${safeName}"`,
        isSystem: true,
      })

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

  async addMembers(
    conversationId: string,
    userId: string,
    memberIds: string[]
  ): Promise<Conversation | null> {
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      participantIds: userId,
      isGroup: true,
    }).exec()

    if (!conversation) return null

    const newMembers = memberIds.filter((id) => !conversation.participantIds.includes(id))
    if (newMembers.length === 0) return conversation as unknown as Conversation

    const updatedParticipantIds = [...conversation.participantIds, ...newMembers]

    const updated = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { participantIds: updatedParticipantIds },
      { new: true }
    ).exec()

    if (updated) {
      const sysMsg = await MessageModel.create({
        conversationId,
        senderId: userId,
        content: `added_users:${newMembers.join(",")}`,
        isSystem: true,
      })

      for (const recipientId of updated.participantIds) {
        try {
          getIO().to(recipientId).emit("conversation:updated", updated)
          getIO().to(recipientId).emit("message:new", sysMsg)
        } catch (err) {}
      }
    }

    return updated as unknown as Conversation | null
  }
}

export default ConversationService
