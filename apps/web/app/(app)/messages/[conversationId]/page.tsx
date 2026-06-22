"use client"

import React, { useEffect, use, useState } from "react"
import { useConversation } from "@/hooks/use-conversation"
import { ChatInput } from "@/components/messages/chat-input"
import { ConversationHeader } from "@/components/messages/conversation-header"
import { MessagesList } from "@/components/messages/messages-list"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useUserCache } from "@/hooks/use-user-cache"
import { useConversationStore } from "@/stores/conversation-store"
import { getUserById, getProfileById } from "@/lib/actions/conversations"

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

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [otherUserDisplay, setOtherUserDisplay] = useState<string | null>(null)

  const cachedUsers = useUserCache((state) => state.users)
  const setUser = useUserCache((state) => state.setUser)

  const storeConv = useConversationStore((s) =>
    s.conversations.find((c) => c._id === conversationId)
  )
  const renameConversation = useConversationStore((s) => s.renameConversation)

  const isGroupConv = storeConv?.isGroup ?? false
  const participantIds = storeConv?.participantIds ?? []

  // Derived display name: group name is reactive via store; 1-on-1 is fetched locally
  const username = isGroupConv ? (storeConv?.name ?? null) : otherUserDisplay

  // Reactive other-user ID (null for groups or while store is loading)
  const otherUserId = useConversationStore((s) => {
    const conv = s.conversations.find((c) => c._id === conversationId)
    if (!conv || conv.isGroup) return null
    return conv.participantIds.find((id) => id !== currentUserId) ?? null
  })

  // Fetch 1-on-1 user profile (skipped for groups)
  useEffect(() => {
    if (!currentUserId || !otherUserId) return

    const fetchOtherUser = async () => {
      const cached = cachedUsers[otherUserId]
      if (cached) {
        setOtherUserDisplay(cached.displayName)
        if (cached.avatarUrl) setAvatarUrl(cached.avatarUrl)
        return
      }

      let authUsername: string | null = null
      let firstName: string | null = null
      let lastName: string | null = null
      let fetchedAvatarUrl: string | undefined

      try {
        const user = await getUserById(otherUserId)
        authUsername = user.username
      } catch (err) {
        console.error("Auth fetch failed", err)
      }

      try {
        const profile = await getProfileById(otherUserId)
        firstName = profile.firstName
        lastName = profile.lastName
        if (profile.avatarId) {
          fetchedAvatarUrl = profile.avatarId
          setAvatarUrl(fetchedAvatarUrl)
        }
      } catch (err) {
        console.error("Profile fetch failed", err)
      }

      const nameParts = []
      if (firstName) nameParts.push(firstName)
      if (lastName) nameParts.push(lastName)

      const fullName = nameParts.join(" ")
      const uname = authUsername || `User ${otherUserId.slice(0, 8)}`
      const display = fullName ? `${fullName} @${uname}` : `@${uname}`

      setOtherUserDisplay(display)
      setUser(otherUserId, { displayName: display, avatarUrl: fetchedAvatarUrl })
    }

    fetchOtherUser()
  }, [currentUserId, conversationId, otherUserId, cachedUsers, setUser])

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      <ConversationHeader
        conversationId={conversationId}
        name={username}
        isGroup={isGroupConv}
        isConnected={isConnected}
        onRename={async (name) => { await renameConversation(conversationId, name) }}
        participantIds={participantIds}
        currentUserId={currentUserId}
      />
      <MessagesList
        messages={messages}
        loading={loading}
        currentUserId={currentUserId}
        avatarUrl={avatarUrl}
        cachedUsers={cachedUsers}
      />
      <ChatInput onSend={sendMessage} disabled={!isConnected} />
    </div>
  )
}
