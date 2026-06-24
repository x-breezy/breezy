"use client"

import React, { use, useState } from "react"
import { useConversation } from "@/hooks/use-conversation"
import { ChatInput } from "@/components/messages/chat-input"
import { ConversationHeader } from "@/components/messages/conversation-header"
import { MessagesList } from "@/components/messages/messages-list"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useUserCache } from "@/hooks/use-user-cache"
import { useConversationStore } from "@/stores/conversation-store"
import { mediaUrl } from "@/lib/utils"
import type { ReplyTo } from "@/lib/actions/messages"
import type { Message } from "@/hooks/use-conversation"

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>
}) {
  const { conversationId } = use(params)
  const { currentUserId } = useCurrentUser()
  const { messages, loading, loadingMore, loadMore, hasMore, sendMessage } = useConversation(
    conversationId,
    currentUserId
  )

  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null)
  const handleReply = (msg: Message, senderName: string) => {
    setReplyTo({ _id: msg._id, content: msg.content, senderName })
  }

  const cachedUsers = useUserCache((state) => state.users)

  const storeConv = useConversationStore((s) =>
    s.conversations.find((c) => c._id === conversationId)
  )
  const isGroupConv = storeConv?.isGroup ?? false
  const participantIds = storeConv?.participantIds ?? []

  const otherUserId = isGroupConv
    ? null
    : (participantIds.find((id) => id !== currentUserId) ?? null)

  const otherProfile = otherUserId ? storeConv?.participants?.[otherUserId] : null

  const otherUserDisplay = (() => {
    if (isGroupConv) return storeConv?.name ?? null
    if (otherProfile) {
      const name = [otherProfile.firstName, otherProfile.lastName].filter(Boolean).join(" ")
      const handle = otherProfile.username
      return name && handle ? `${name} @${handle}` : handle ? `@${handle}` : name || null
    }
    const cached = otherUserId ? cachedUsers[otherUserId] : null
    return cached?.displayName ?? null
  })()

  const avatarUrl = (() => {
    if (isGroupConv || !otherUserId) return undefined
    const id = otherProfile?.avatarId ?? cachedUsers[otherUserId]?.avatarUrl
    return id ? (id.startsWith("http") ? id : mediaUrl(id)) : undefined
  })()

  const otherUserRole = otherProfile?.role ?? null

  return (
    <div className='flex h-full flex-col'>
      <ConversationHeader
        conversationId={conversationId}
        name={otherUserDisplay}
        isGroup={isGroupConv}
        participantIds={participantIds}
        currentUserId={currentUserId}
        participants={storeConv?.participants}
      />
      <MessagesList
        messages={messages}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        onLoadMore={loadMore}
        currentUserId={currentUserId}
        avatarUrl={avatarUrl}
        cachedUsers={cachedUsers}
        participants={storeConv?.participants}
        otherUserDisplay={otherUserDisplay}
        otherUserRole={otherUserRole}
        isGroup={isGroupConv}
        participantIds={participantIds}
        onReply={handleReply}
      />
      <ChatInput onSend={sendMessage} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
    </div>
  )
}
