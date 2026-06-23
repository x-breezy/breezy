"use client"

import React, { useEffect } from "react"
import { useParams } from "next/navigation"
import { ConversationSidebar } from "@/components/messages/conversation-sidebar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useSocket } from "@/hooks/use-socket"
import { useConversationStore } from "@/stores/conversation-store"

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { currentUserId } = useCurrentUser()
  const params = useParams()
  const conversationId = params?.conversationId as string | undefined
  const { socket } = useSocket(currentUserId)
  const fetchConversations = useConversationStore((s) => s.fetchConversations)
  const clearUnread = useConversationStore((s) => s.clearUnread)
  const updateLastMessage = useConversationStore((s) => s.updateLastMessage)
  const updateConversationMeta = useConversationStore((s) => s.updateConversationMeta)

  useEffect(() => {
    if (!currentUserId) return
    fetchConversations(conversationId)
  }, [currentUserId, conversationId, fetchConversations])

  useEffect(() => {
    if (!socket || !currentUserId) return

    const handleNewMessage = (message: {
      conversationId: string
      senderId: string
      content: string
      createdAt?: string
    }) => {
      updateLastMessage(message, currentUserId, conversationId)
    }

    const handleConversationUpdated = (updatedConv: {
      _id: string
      name?: string
      isGroup?: boolean
    }) => {
      updateConversationMeta(updatedConv._id, {
        name: updatedConv.name,
        isGroup: updatedConv.isGroup,
      })
    }

    socket.on("message:new", handleNewMessage)
    socket.on("conversation:updated", handleConversationUpdated)
    return () => {
      socket.off("message:new", handleNewMessage)
      socket.off("conversation:updated", handleConversationUpdated)
    }
  }, [socket, currentUserId, conversationId, updateConversationMeta, updateLastMessage])

  useEffect(() => {
    if (conversationId) clearUnread(conversationId)
  }, [conversationId, clearUnread])

  if (!currentUserId) return null

  return (
    <div
      className={`flex w-full overflow-hidden font-sans ${conversationId ? "-mb-[3.75rem] h-[calc(100%+3.75rem)] lg:mb-0 lg:h-full" : "h-full"}`}
    >
      <ConversationSidebar
        className={conversationId ? "hidden md:flex" : "flex"}
        activeId={conversationId}
        currentUserId={currentUserId}
      />
      <main
        className={`relative flex h-full min-h-0 min-w-0 flex-1 flex-col ${!conversationId ? "hidden md:block" : "flex"}`}
      >
        {children}
      </main>
    </div>
  )
}
