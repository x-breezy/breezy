import { create } from "zustand"
import {
  type ConversationMeta,
  listConversations,
  createConversation as apiCreateConversation,
  deleteConversation as apiDeleteConversation,
  renameConversation as apiRenameConversation,
  addConversationMember,
} from "@/lib/actions/conversations"

export type { ConversationMeta }

interface ConversationState {
  conversations: ConversationMeta[]
  loading: boolean
  fetchConversations: (activeId?: string) => Promise<void>
  clearUnread: (id: string) => void
  updateLastMessage: (
    msg: { conversationId: string; content: string; createdAt?: string; senderId: string },
    currentUserId: string,
    activeConversationId?: string
  ) => void
  updateConversationMeta: (
    id: string,
    update: { name?: string; isGroup?: boolean; lastMessageSenderId?: string }
  ) => void
  addConversation: (conv: ConversationMeta) => void
  removeConversation: (id: string) => void
  renameConversation: (id: string, name: string) => Promise<string>
  createConversation: (recipientIds: string[], name?: string) => Promise<ConversationMeta>
  deleteConversation: (id: string) => Promise<void>
  addMember: (id: string, memberIds: string[]) => Promise<void>
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  loading: false,

  fetchConversations: async (activeId) => {
    if (get().loading) return
    set({ loading: true })
    try {
      const conversations = await listConversations()
      set({
        conversations: conversations.map((c) =>
          c._id === activeId ? { ...c, hasUnread: false, unreadCount: 0 } : c
        ),
      })
    } catch (err) {
      console.error(err)
    } finally {
      set({ loading: false })
    }
  },

  clearUnread: (id) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c._id === id ? { ...c, hasUnread: false, unreadCount: 0 } : c
      ),
    }))
  },

  updateLastMessage: (msg, currentUserId, activeConversationId) => {
    const conv = get().conversations.find((c) => c._id === msg.conversationId)
    if (!conv) {
      get().fetchConversations()
      return
    }
    const isActive = msg.conversationId === activeConversationId
    const updated: ConversationMeta = {
      ...conv,
      lastMessage: msg.content,
      lastMessageSenderId: msg.senderId,
      lastMessageAt: msg.createdAt || new Date().toISOString(),
      hasUnread: conv.hasUnread || (!isActive && msg.senderId !== currentUserId),
      unreadCount: isActive ? 0 : msg.senderId !== currentUserId ? (conv.unreadCount || 0) + 1 : (conv.unreadCount || 0),
    }
    set((s) => ({
      conversations: [updated, ...s.conversations.filter((c) => c._id !== msg.conversationId)],
    }))
  },

  updateConversationMeta: (id, update) => {
    set((s) => ({
      conversations: s.conversations.map((c) => (c._id === id ? { ...c, ...update } : c)),
    }))
  },

  addConversation: (conv) => {
    set((s) => ({
      conversations: [conv, ...s.conversations.filter((c) => c._id !== conv._id)],
    }))
  },

  removeConversation: (id) => {
    set((s) => ({ conversations: s.conversations.filter((c) => c._id !== id) }))
  },

  renameConversation: async (id, name) => {
    const newName = await apiRenameConversation(id, name)
    get().updateConversationMeta(id, { name: newName })
    return newName
  },

  createConversation: async (recipientIds, name) => {
    const conv = await apiCreateConversation(recipientIds, name)
    get().addConversation(conv)
    return conv
  },

  deleteConversation: async (id) => {
    await apiDeleteConversation(id)
    get().removeConversation(id)
  },

  addMember: async (id, memberIds) => {
    await addConversationMember(id, memberIds)
  },
}))
