"use client"

import React, { useEffect, useRef, use } from "react"
import { useConversation } from "@/hooks/use-conversation"
import { MessageBubble } from "@/components/messages/message-bubble"
import { ChatInput } from "@/components/messages/chat-input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { IconLoader2 } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = use(params)
  const { currentUserId } = useCurrentUser()
  const { messages, loading, sendMessage, isConnected } = useConversation(
    conversationId,
    currentUserId
  )

  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className='flex h-full flex-col bg-white dark:bg-gray-950'>
      {/* Header */}
      <header className='sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80'>
        <div>
          <h2 className='text-lg font-bold'>Conversation</h2>
          <p className='text-xs text-gray-500'>
            {isConnected ? (
              <span className='flex items-center gap-1 text-green-500'>
                <span className='h-2 w-2 rounded-full bg-green-500'></span> Online
              </span>
            ) : (
              <span className='text-gray-400'>Connecting...</span>
            )}
          </p>
        </div>
      </header>

      {/* Messages Area */}
      <div className='flex-1 overflow-y-auto scroll-smooth p-6'>
        {loading ? (
          <div className='flex h-full items-center justify-center text-gray-400'>
            <IconLoader2 className='animate-spin' size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className='flex h-full items-center justify-center text-gray-400'>
            No messages yet. Say hi!
          </div>
        ) : (
          <div className='flex flex-col'>
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                content={msg.content}
                createdAt={msg.createdAt}
                isOwn={msg.senderId === currentUserId}
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
