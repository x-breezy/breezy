"use client"

import React, { useEffect, useRef, use, useState } from "react"
import { useConversation } from "@/hooks/use-conversation"
import { MessageBubble } from "@/components/messages/message-bubble"
import { ChatInput } from "@/components/messages/chat-input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { IconLoader2, IconArrowLeft, IconUserPlus } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUserCache } from "@/hooks/use-user-cache"
import { useSocket } from "@/hooks/use-socket"
import { Button } from "@/components/ui/button"
import apiClient from "@/lib/api/client"
import { TagInput } from "@/components/ui/tag-input"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"

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
  // Keep latest messages accessible to effects without making them a dependency
  // (avoids refetching the conversation list on every new message → 429s).
  const messagesRef = useRef(messages)
  messagesRef.current = messages
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined)
  const [username, setUsername] = useState<string | null>(null)
  const [isGroupConv, setIsGroupConv] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState("")
  const cachedUsers = useUserCache((state) => state.users)
  const setUser = useUserCache((state) => state.setUser)
  const { socket } = useSocket(currentUserId)
  const router = useRouter()

  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [newMemberUsernames, setNewMemberUsernames] = useState<string[]>([])
  const [addingMember, setAddingMember] = useState(false)
  const [participantIds, setParticipantIds] = useState<string[]>([])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch the other user's avatar and username
  useEffect(() => {
    if (!currentUserId) return

    const fetchOtherUser = async () => {
      let resolvedId = null
      let isGroup = false
      let groupName = null

      try {
        const convRes = await apiClient.get(`/api/conversations/`)
        const convData = convRes.data
        if (convData.success && convData.data) {
          const conv = convData.data.find((c: any) => c._id === conversationId)
          if (conv) {
            setParticipantIds(conv.participantIds || [])
            if (conv.isGroup) {
              isGroup = true
              groupName = conv.name || "Groupe"
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
        resolvedId = messagesRef.current.find((m) => m.senderId !== currentUserId)?.senderId
      }

      if (!resolvedId || resolvedId === "Unknown") {
        setUsername("Conversation")
        return
      }

      // Check cache first
      const cached = cachedUsers[resolvedId]
      if (cached) {
        setUsername(cached.displayName)
        if (cached.avatarUrl) setAvatarUrl(cached.avatarUrl)
        return
      }

      // Fetch Username and Profile identically to sidebar
      let authUsername = null
      let profileFirstName = null
      let profileLastName = null
      let fetchedAvatarUrl = undefined

      try {
        const authRes = await apiClient.get(`/api/users/${resolvedId}`)
        const authData = authRes.data
        if (authData.success && authData.data) {
          authUsername = authData.data.username
        }
      } catch (err) {
        console.error("Auth fetch failed", err)
      }

      try {
        const profileRes = await apiClient.get(`/api/profiles/${resolvedId}`)
        const profileData = profileRes.data
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
  }, [currentUserId, conversationId, cachedUsers, setUser])

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
      const res = await apiClient.patch(`/api/conversations/${conversationId}/name`, {
        name: editNameValue.trim(),
      })
      const data = res.data
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

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMemberUsernames.length === 0 || !currentUserId) return

    const usernamesToFetch = newMemberUsernames
    if (usernamesToFetch.length === 0) return

    setAddingMember(true)
    try {
      const newMemberIds: string[] = []
      for (const uname of usernamesToFetch) {
        // axios throws on 404 (unlike fetch), so a missing username lands here.
        let authData
        try {
          const authRes = await apiClient.get(`/api/users/by-username/${uname}`)
          authData = authRes.data
        } catch {
          authData = null
        }

        if (!authData?.success || !authData?.data) {
          alert(`User not found: ${uname}`)
          setAddingMember(false)
          return
        }
        newMemberIds.push(authData.data.id)
      }

      if (isGroupConv) {
        // Add to existing group
        const res = await apiClient.post(`/api/conversations/${conversationId}/members`, {
          memberIds: newMemberIds,
        })
        const data = res.data
        if (data.success) {
          setAddMemberOpen(false)
          setNewMemberUsernames([])
          router.refresh()
        } else {
          alert(data.message || "Failed to add member")
        }
      } else {
        // Create new group
        const existingMembers = participantIds.filter((id) => id !== currentUserId)
        const allRecipientIds = [...existingMembers, ...newMemberIds]

        const res = await apiClient.post(`/api/conversations/`, { recipientIds: allRecipientIds })
        const data = res.data

        if (data.success && data.data) {
          setAddMemberOpen(false)
          setNewMemberUsernames([])
          router.push(`/messages/${data.data._id}`)
          router.refresh()
        } else {
          alert(data.message || "Failed to create new group")
        }
      }
    } catch (err) {
      console.error(err)
      alert("Failed to add member(s)")
    } finally {
      setAddingMember(false)
    }
  }

  return (
    <div className='flex h-full flex-col bg-white dark:bg-gray-950'>
      {/* Header */}
      <header className='sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md md:px-6 dark:border-gray-800 dark:bg-gray-950/80'>
        <div className='flex items-center'>
          <Link
            href='/messages'
            className='mr-3 -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden dark:hover:bg-gray-800'
          >
            <IconArrowLeft size={20} />
          </Link>
          <div>
            <div className='max-w-[200px] truncate text-lg font-bold md:max-w-[300px]'>
              {username === null ? (
                <div className='mt-1 mb-1 h-6 w-32 animate-pulse rounded bg-foreground/10'></div>
              ) : isEditingName ? (
                <input
                  autoFocus
                  className='w-full border-b border-foreground bg-transparent focus:outline-none'
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                />
              ) : (
                <span
                  className={
                    isGroupConv
                      ? "cursor-pointer decoration-gray-400 decoration-dashed underline-offset-4 hover:underline"
                      : ""
                  }
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

        <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
          <DialogTrigger
            render={
              <Button variant='ghost' size='icon' className='rounded-full' title='Add member'>
                <IconUserPlus size={20} />
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member(s)</DialogTitle>
              <DialogDescription>
                {isGroupConv
                  ? "Tapez le nom d'utilisateur et appuyez sur Entrée pour l'ajouter au groupe."
                  : "Tapez le nom d'utilisateur et appuyez sur Entrée pour créer un nouveau groupe."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMemberSubmit} className='space-y-4 pt-4'>
              <TagInput
                placeholder='Tapez un username et Entrée...'
                tags={newMemberUsernames}
                setTags={setNewMemberUsernames}
                disabled={addingMember}
              />
              <DialogFooter>
                <DialogClose
                  render={
                    <Button type='button' variant='outline'>
                      Cancel
                    </Button>
                  }
                />
                <Button type='submit' disabled={newMemberUsernames.length === 0 || addingMember}>
                  {addingMember ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
              const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId

              let senderName = msg.senderId === currentUserId ? "Vous" : "Quelqu'un"
              const senderCache = cachedUsers[msg.senderId]
              if (msg.senderId !== currentUserId && senderCache) {
                const parts = senderCache.displayName.split(" @")
                senderName = parts[0] || parts[1] || senderName
              }

              let displayContent = msg.content
              if (msg.isSystem && msg.content.startsWith("added_users:")) {
                displayContent = "a ajouté de nouveau(x) membre(s)"
              }

              return (
                <MessageBubble
                  key={msg._id}
                  content={displayContent}
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
