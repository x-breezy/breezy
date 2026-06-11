"use client"

import React, { useEffect, useRef, use, useState } from "react"
import { useConversation } from "@/hooks/use-conversation"
import { MessageBubble } from "@/components/messages/message-bubble"
import { ChatInput } from "@/components/messages/chat-input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch the other user's avatar
  useEffect(() => {
    if (!currentUserId || messages.length === 0) return
    const otherUserId = messages.find((m) => m.senderId !== currentUserId)?.senderId
    if (!otherUserId) return

    const PROFILE_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || "http://localhost:4002"
    fetch(`${PROFILE_URL}/profiles/${otherUserId}`, {
      headers: { "x-user-id": currentUserId, "x-roles": "user" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.avatarId) {
          // If avatarId is just an ID, you might need a media service URL, 
          // but assuming it's a valid src or handled by Avatar component
          setAvatarUrl(data.data.avatarId)
        }
      })
      .catch(console.error)
  }, [messages, currentUserId])

  return (
    <div className='flex h-full flex-col bg-white dark:bg-gray-950'>
      {/* Header */}
      <header className='shrink-0 sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 md:px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80'>
        <div className="flex items-center">
          <Link href="/messages" className="mr-3 md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <IconArrowLeft size={20} />
          </Link>
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
            {messages.map((msg, index) => {
              const prevMsg = index > 0 ? messages[index - 1] : null
              const isConsecutive = prevMsg !== null && prevMsg.senderId === msg.senderId
              return (
              <MessageBubble
                key={msg._id}
                content={msg.content}
                createdAt={msg.createdAt}
                isOwn={msg.senderId === currentUserId}
                  isConsecutive={isConsecutive}
                  avatarUrl={avatarUrl}
              />
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={sendMessage} disabled={!isConnected} />
    </div>
  )
}
