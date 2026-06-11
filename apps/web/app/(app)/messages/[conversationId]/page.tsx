"use client"

import React, { useEffect, useRef, use, useState } from "react"
import { useConversation } from "@/hooks/use-conversation"
import { MessageBubble } from "@/components/messages/message-bubble"
import { ChatInput } from "@/components/messages/chat-input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { IconLoader2, IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserCache } from "@/hooks/use-user-cache"

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
  
  // 1. Try to compute otherUserId synchronously from messages if available
  const otherUserIdFromMessages = messages.find((m) => m.senderId !== currentUserId)?.senderId
  const [fetchedOtherUserId, setFetchedOtherUserId] = useState<string | undefined>(undefined)
  const otherUserId = otherUserIdFromMessages || fetchedOtherUserId

  // 2. Access our global cache
  const cachedUser = useUserCache((state) => (otherUserId ? state.users[otherUserId] : undefined))
  const setUser = useUserCache((state) => state.setUser)

  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [username, setUsername] = useState<string | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Sync cache -> local state instantly when cache updates
  useEffect(() => {
    if (cachedUser) {
      setUsername(cachedUser.displayName)
      if (cachedUser.avatarUrl) setAvatarUrl(cachedUser.avatarUrl)
    }
  }, [cachedUser])

  // Fetch the other user's avatar and username if not cached
  useEffect(() => {
    if (!currentUserId) return
    if (cachedUser) return // We already have the data, skip fetching

    const fetchOtherUser = async () => {
      let resolvedId = otherUserIdFromMessages

      if (!resolvedId) {
        try {
          const MESSAGE_API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
          const convRes = await fetch(`${MESSAGE_API_URL}/conversations`, {
            headers: { "x-user-id": currentUserId, "x-roles": "user" },
          })
          const convData = await convRes.json()
          if (convData.success && convData.data) {
            const conv = convData.data.find((c: any) => c._id === conversationId)
            if (conv) {
              resolvedId = conv.participantIds.find((id: string) => id !== currentUserId)
              setFetchedOtherUserId(resolvedId)
            }
          }
        } catch (err) {
          console.error("Failed to fetch conversation list", err)
        }
      }

      if (!resolvedId || resolvedId === "Unknown") {
        setUsername("Conversation")
        return
      }

      // If we got here and the cache was updated in the meantime, abort
      const currentCache = useUserCache.getState().users[resolvedId]
      if (currentCache) {
        setUsername(currentCache.displayName)
        if (currentCache.avatarUrl) setAvatarUrl(currentCache.avatarUrl)
        return
      }

      // Fetch Username and Profile identically to sidebar
      let authUsername = null;
      let profileFirstName = null;
      let profileLastName = null;
      let fetchedAvatarUrl = undefined;

      try {
        const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"
        const authRes = await fetch(`${AUTH_URL}/users/${resolvedId}`, {
          headers: { "x-user-id": currentUserId, "x-roles": "user" },
        })
        const authData = await authRes.json()
        if (authData.success && authData.data) {
          authUsername = authData.data.username
        }
      } catch (err) {
        console.error("Auth fetch failed", err)
      }

      try {
        const PROFILE_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || "http://localhost:4010"
        const profileRes = await fetch(`${PROFILE_URL}/profiles/${resolvedId}`, {
          headers: { "x-user-id": currentUserId, "x-roles": "user" },
        })
        const profileData = await profileRes.json()
        if (profileData.success && profileData.data) {
          profileFirstName = profileData.data.firstName
          profileLastName = profileData.data.lastName
          if (profileData.data.avatarId) {
            fetchedAvatarUrl = profileData.data.avatarId
            setAvatarUrl(fetchedAvatarUrl)
          }
        }
      } catch (err) {
        console.error("Profile fetch failed", err)
      }

      const nameParts = []
      if (profileFirstName) nameParts.push(profileFirstName)
      if (profileLastName) nameParts.push(profileLastName)
      
      const fullName = nameParts.join(" ")
      const uname = authUsername || `User ${resolvedId.slice(0, 8)}`
      const display = fullName ? `${fullName} @${uname}` : `@${uname}`
      
      setUsername(display)
      setUser(resolvedId, { displayName: display, avatarUrl: fetchedAvatarUrl })
    }

    fetchOtherUser()
  }, [otherUserIdFromMessages, currentUserId, conversationId, cachedUser, setUser])

  return (
    <div className='flex h-full flex-col bg-white dark:bg-gray-950'>
      {/* Header */}
      <header className='shrink-0 sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 md:px-6 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80'>
        <div className="flex items-center">
          <Link href="/messages" className="mr-3 md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <div className='text-lg font-bold truncate max-w-[200px] md:max-w-[300px]'>
              {username ? username : (
                <div className="h-6 w-32 bg-foreground/10 animate-pulse rounded mt-1 mb-1"></div>
              )}
            </div>
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
