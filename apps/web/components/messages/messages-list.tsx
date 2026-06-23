"use client"

import React, { useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { IconLoader2 } from "@tabler/icons-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { DateSeparator } from "./date-separator"
import { ConversationIntro } from "./conversation-intro"
import type { Message } from "@/lib/actions/messages"

interface MessagesListProps {
  messages: Message[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  currentUserId: string | undefined
  cachedUsers: Record<string, { displayName: string; avatarUrl?: string }>
  otherUserDisplay: string | null
  avatarUrl?: string
  isGroup: boolean
  participantIds: string[]
  onReply?: (msg: Message, senderName: string) => void
}

function sameDay(a: string, b: string) {
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

export function MessagesList({
  messages,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  currentUserId,
  cachedUsers,
  otherUserDisplay,
  avatarUrl,
  isGroup,
  participantIds,
  onReply,
}: MessagesListProps) {
  const t = useTranslations("messages")
  const bottomRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const prevLength = useRef(messages.length)

  const isInitialRender = useRef(true)

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      bottomRef.current?.scrollIntoView()
    } else if (messages.length > prevLength.current) {
      bottomRef.current?.scrollIntoView()
    }
    prevLength.current = messages.length
  }, [messages])

  // IntersectionObserver for scroll-to-top pagination
  useEffect(() => {
    if (!topRef.current || !hasMore || !onLoadMore) return
    const el = topRef.current
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onLoadMore()
      },
      { rootMargin: "200px 0px 0px 0px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  if (loading) {
    return (
      <div className='flex flex-1 items-center justify-center'>
        <IconLoader2 className='animate-spin' size={32} />
      </div>
    )
  }

  return (
    <ScrollArea className='h-full flex-1'>
      <div className='flex flex-col px-4 pb-4'>
        {loadingMore && (
          <div className='flex justify-center py-3'>
            <IconLoader2 className='animate-spin' size={20} />
          </div>
        )}
        <div ref={topRef} />
        <ConversationIntro
          displayName={otherUserDisplay}
          avatarUrl={avatarUrl}
          isGroup={isGroup}
          memberCount={participantIds.length}
          participantIds={participantIds}
          currentUserId={currentUserId}
        />

        {messages.length === 0 && (
          <p className='py-8 text-center text-sm text-muted-foreground'>{t("noMessages")}</p>
        )}

        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null

          const isConsecutive = !!(
            prevMsg &&
            prevMsg.senderId === msg.senderId &&
            !msg.isSystem &&
            !prevMsg.isSystem &&
            sameDay(prevMsg.createdAt, msg.createdAt)
          )

          const isLastOfGroup =
            !nextMsg ||
            nextMsg.senderId !== msg.senderId ||
            !sameDay(msg.createdAt, nextMsg.createdAt) ||
            !!nextMsg.isSystem

          const showDateSep = !prevMsg || !sameDay(prevMsg.createdAt, msg.createdAt)

          let senderName = msg.senderId === currentUserId ? t("you") : t("someone")
          const senderCache = cachedUsers[msg.senderId]
          if (msg.senderId !== currentUserId && senderCache) {
            const parts = senderCache.displayName.split(" @")
            senderName = parts[0] || parts[1] || senderName
          }

          if (msg.isSystem) {
            const displayContent = msg.content.startsWith("added_users:")
              ? t("addedMembers")
              : msg.content
            return (
              <React.Fragment key={msg._id}>
                {showDateSep && <DateSeparator dateStr={msg.createdAt} />}
                <MessageBubble variant='system' content={displayContent} senderName={senderName} />
              </React.Fragment>
            )
          }

          const msgAvatarUrl = cachedUsers[msg.senderId]?.avatarUrl

          return (
            <React.Fragment key={msg._id}>
              {showDateSep && <DateSeparator dateStr={msg.createdAt} />}
              <MessageBubble
                variant='message'
                content={msg.content}
                createdAt={msg.createdAt}
                isOwn={msg.senderId === currentUserId}
                isConsecutive={isConsecutive}
                isLastOfGroup={isLastOfGroup}
                avatarUrl={msgAvatarUrl}
                senderName={senderName}
                replyTo={msg.replyTo}
                onReply={onReply ? () => onReply(msg, senderName) : undefined}
              />
            </React.Fragment>
          )
        })}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
