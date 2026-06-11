"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ConversationSidebar, type ConversationMeta } from "@/components/messages/conversation-sidebar"
import { useCurrentUser } from "@/hooks/use-current-user"
export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const { currentUserId, changeUser } = useCurrentUser()
  const params = useParams()
  const conversationId = params?.conversationId as string | undefined


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

  if (!currentUserId) return null;

  return (
    <div className={`flex bg-gray-50 dark:bg-black w-full font-sans overflow-hidden ${conversationId ? "h-[calc(100%+3.75rem)] -mb-[3.75rem] lg:h-full lg:mb-0" : "h-full"}`}>


      <ConversationSidebar
        className={conversationId ? "hidden md:flex" : "flex"}
        activeId={conversationId}
        conversations={conversations}
        currentUserId={currentUserId}
        onConversationCreated={(newConv) => {
          setConversations(prev => {
            // Remove if already exists (e.g. they created an existing one)
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
