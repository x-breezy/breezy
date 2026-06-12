"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ConversationSidebar, type ConversationMeta } from "@/components/messages/conversation-sidebar"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useSocket } from "@/hooks/use-socket"

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const { currentUserId } = useCurrentUser()
  const params = useParams()
  const conversationId = params?.conversationId as string | undefined
  const { socket } = useSocket(currentUserId)

  useEffect(() => {
    if (!currentUserId) return;
    
    // Fetch conversations list
    const API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
    fetch(`${API_URL}/conversations`, {
      headers: {
        "x-user-id": currentUserId,
        "x-roles": "user",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setConversations(data.data)
        }
      })
      .catch(console.error)
  }, [currentUserId])

  useEffect(() => {
    if (!socket || !currentUserId) return;

    const handleNewMessage = (message: any) => {
      setConversations((prev) => {
        const existingConvIndex = prev.findIndex(c => c._id === message.conversationId)
        
        if (existingConvIndex !== -1) {
          const existingConv = prev[existingConvIndex]
          const updatedConv = {
            ...existingConv,
            lastMessage: message.content,
            lastMessageAt: message.createdAt || new Date().toISOString(),
            hasUnread: message.conversationId !== conversationId && message.senderId !== currentUserId
          }
          const filtered = prev.filter(c => c._id !== message.conversationId)
          return [updatedConv, ...filtered]
        } else {
          // Refetch conversations if it's a completely new one we don't know about yet
          const API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
          fetch(`${API_URL}/conversations`, {
            headers: { "x-user-id": currentUserId, "x-roles": "user" }
          })
            .then(r => r.json())
            .then(data => {
              if (data.success && data.data) setConversations(data.data)
            }).catch(console.error)
          return prev
        }
      })
    }

    const handleConversationUpdated = (updatedConv: any) => {
      setConversations(prev => prev.map(c => 
        c._id === updatedConv._id ? { ...c, name: updatedConv.name, isGroup: updatedConv.isGroup } : c
      ))
    }

    socket.on("message:new", handleNewMessage)
    socket.on("conversation:updated", handleConversationUpdated)
    return () => {
      socket.off("message:new", handleNewMessage)
      socket.off("conversation:updated", handleConversationUpdated)
    }
  }, [socket, currentUserId, conversationId])

  useEffect(() => {
    if (conversationId) {
      setConversations(prev => prev.map(c => 
        c._id === conversationId && c.hasUnread ? { ...c, hasUnread: false } : c
      ))
    }
  }, [conversationId])

  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      // Pin unread conversations to the top
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      
      // Then sort by last message date descending
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [conversations]);

  if (!currentUserId) return null;

  return (
    <div className={`flex bg-gray-50 dark:bg-black w-full font-sans overflow-hidden ${conversationId ? "h-[calc(100%+3.75rem)] -mb-[3.75rem] lg:h-full lg:mb-0" : "h-full"}`}>
      <ConversationSidebar
        className={conversationId ? "hidden md:flex" : "flex"}
        activeId={conversationId}
        conversations={sortedConversations}
        currentUserId={currentUserId}
        onConversationCreated={(newConv) => {
          setConversations(prev => {
            const filtered = prev.filter(c => c._id !== newConv._id)
            return [newConv, ...filtered]
          })
        }}
        onConversationDeleted={(id) => {
          setConversations(prev => prev.filter(c => c._id !== id))
        }}
      />
      <main className={`flex-1 relative h-full flex flex-col min-w-0 min-h-0 ${!conversationId ? "hidden md:block" : "flex"}`}>
        {children}
      </main>
    </div>
  )
}
