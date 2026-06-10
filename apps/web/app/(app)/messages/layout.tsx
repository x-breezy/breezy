"use client"

import React, { useEffect, useState } from "react"
import { ConversationSidebar, type ConversationMeta } from "../../../components/messages/conversation-sidebar"

// Mocked user ID for testing the UI
export const CURRENT_USER_ID = "00000000-0000-0000-0000-000000000001"

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([])

  useEffect(() => {
    // Fetch conversations list
    const API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
    fetch(`${API_URL}/conversations`, {
      headers: {
        "x-user-id": CURRENT_USER_ID,
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
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-black w-full font-sans overflow-hidden">
      <ConversationSidebar
        conversations={conversations}
        currentUserId={CURRENT_USER_ID}
      />
      <main className="flex-1 relative">
        {children}
      </main>
    </div>
  )
}
