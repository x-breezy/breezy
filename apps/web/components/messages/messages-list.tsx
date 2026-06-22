"use client"

import React, { useRef, useEffect } from "react"
import { IconLoader2 } from "@tabler/icons-react"
import { MessageBubble } from "./message-bubble"
import type { Message } from "@/lib/actions/messages"

interface MessagesListProps {
  messages: Message[]
  loading: boolean
  currentUserId: string | undefined
  avatarUrl?: string
  cachedUsers: Record<string, { displayName: string; avatarUrl?: string }>
}

export function MessagesList({
  messages,
  loading,
  currentUserId,
  avatarUrl,
  cachedUsers,
}: MessagesListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        <IconLoader2 className="animate-spin" size={32} />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        No messages yet. Say hi!
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-smooth p-6">
      <div className="flex flex-col">
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null
          const isConsecutive = !!(prevMsg && prevMsg.senderId === msg.senderId)

          let senderName = msg.senderId === currentUserId ? "Vous" : "Quelqu'un"
          const senderCache = cachedUsers[msg.senderId]
          if (msg.senderId !== currentUserId && senderCache) {
            const parts = senderCache.displayName.split(" @")
            senderName = parts[0] || parts[1] || senderName
          }

          if (msg.isSystem) {
            const displayContent = msg.content.startsWith("added_users:")
              ? "a ajouté de nouveau(x) membre(s)"
              : msg.content
            return (
              <MessageBubble
                key={msg._id}
                variant="system"
                content={displayContent}
                senderName={senderName}
              />
            )
          }

          return (
            <MessageBubble
              key={msg._id}
              variant="message"
              content={msg.content}
              createdAt={msg.createdAt}
              isOwn={msg.senderId === currentUserId}
              isConsecutive={isConsecutive}
              avatarUrl={avatarUrl}
              senderName={senderName}
            />
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
