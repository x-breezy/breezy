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
import { useSocket } from "@/hooks/use-socket"

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
  const [username, setUsername] = useState<string | null>(null)
  const [isGroupConv, setIsGroupConv] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState("")
  const cachedUsers = useUserCache((state) => state.users)
  const setUser = useUserCache((state) => state.setUser)
  const { socket } = useSocket(currentUserId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch the other user's avatar and username
  useEffect(() => {
    if (!currentUserId) return

    const fetchOtherUser = async () => {
      let resolvedId = null;
      let isGroup = false;
      let groupName = null;

      try {
        const MESSAGE_API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
        const convRes = await fetch(`${MESSAGE_API_URL}/conversations`, {
          headers: { "x-user-id": currentUserId, "x-roles": "user" },
        })
        const convData = await convRes.json()
        if (convData.success && convData.data) {
          const conv = convData.data.find((c: any) => c._id === conversationId)
          if (conv) {
            if (conv.isGroup) {
              isGroup = true;
              groupName = conv.name || "Groupe";
            } else {
              resolvedId = conv.participantIds.find((id: string) => id !== currentUserId)
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch conversation list", err)
      }

      if (isGroup) {
        setUsername(groupName)
        setIsGroupConv(true)
        setEditNameValue(groupName || "")
        return
      }

      if (!resolvedId) {
        resolvedId = messages.find((m) => m.senderId !== currentUserId)?.senderId
      }

      if (!resolvedId || resolvedId === "Unknown") {
        setUsername("Conversation")
        return
      }

      // Check cache first
      if (cachedUsers[resolvedId]) {
        setUsername(cachedUsers[resolvedId].displayName)
        if (cachedUsers[resolvedId].avatarUrl) setAvatarUrl(cachedUsers[resolvedId].avatarUrl)
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
  }, [messages, currentUserId, conversationId, cachedUsers, setUser])

  useEffect(() => {
    if (!socket) return

    const handleConversationUpdated = (updatedConv: any) => {
      if (updatedConv._id === conversationId) {
        setUsername(updatedConv.name || "Groupe")
        setEditNameValue(updatedConv.name || "")
        setIsGroupConv(updatedConv.isGroup)
      }
    }

    socket.on("conversation:updated", handleConversationUpdated)
    return () => {
      socket.off("conversation:updated", handleConversationUpdated)
    }
  }, [socket, conversationId])

  const handleRenameSubmit = async () => {
    if (!editNameValue.trim() || editNameValue === username) {
      setIsEditingName(false)
      return
    }

    try {
      const MESSAGE_API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
      const res = await fetch(`${MESSAGE_API_URL}/conversations/${conversationId}/name`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId!,
          "x-roles": "user",
        },
        body: JSON.stringify({ name: editNameValue.trim() }),
      })
      const data = await res.json()
      if (data.success && data.data) {
        setUsername(data.data.name)
      } else {
        setEditNameValue(username || "")
        alert(data.message || "Failed to rename conversation")
      }
    } catch (err) {
      console.error(err)
      setEditNameValue(username || "")
    } finally {
      setIsEditingName(false)
    }
  }

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
              {username === null ? (
                <div className="h-6 w-32 bg-foreground/10 animate-pulse rounded mt-1 mb-1"></div>
              ) : isEditingName ? (
                <input
                  autoFocus
                  className="bg-transparent border-b border-foreground focus:outline-none w-full"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                />
              ) : (
                <span 
                  className={isGroupConv ? "cursor-pointer hover:underline decoration-dashed decoration-gray-400 underline-offset-4" : ""}
                  onClick={() => isGroupConv && setIsEditingName(true)}
                  title={isGroupConv ? "Click to rename group" : ""}
                >
                  {username}
                </span>
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
              
              let senderName = msg.senderId === currentUserId ? "Vous" : "Quelqu'un"
              if (msg.senderId !== currentUserId && cachedUsers[msg.senderId]) {
                const parts = cachedUsers[msg.senderId].displayName.split(" @")
                senderName = parts[0] || parts[1] || senderName
              }

              return (
              <MessageBubble
                key={msg._id}
                content={msg.content}
                createdAt={msg.createdAt}
                isOwn={msg.senderId === currentUserId}
                isConsecutive={isConsecutive}
                avatarUrl={avatarUrl}
                isSystem={msg.isSystem}
                senderName={senderName}
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
