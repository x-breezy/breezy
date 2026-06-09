"use client"

import React, { useEffect, useRef, use } from "react"
import { useConversation } from "../../../../hooks/use-conversation.js"
import { MessageBubble } from "../../../../components/messages/message-bubble.js"
import { ChatInput } from "../../../../components/messages/chat-input.js"
import { CURRENT_USER_ID } from "../layout.js"
import { IconLoader2 } from "@tabler/icons-react"

export default function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params)
  const { messages, loading, sendMessage, isConnected } = useConversation(conversationId, CURRENT_USER_ID)
  
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="h-16 px-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-10">
        <div>
          <h2 className="font-bold text-lg">Conversation</h2>
          <p className="text-xs text-gray-500">
            {isConnected ? (
              <span className="text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online</span>
            ) : (
              <span className="text-gray-400">Connecting...</span>
            )}
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {loading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <IconLoader2 className="animate-spin" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            No messages yet. Say hi!
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                content={msg.content}
                createdAt={msg.createdAt}
                isOwn={msg.senderId === CURRENT_USER_ID}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={sendMessage} disabled={!isConnected} />
    </div>
  )
}
