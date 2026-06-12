"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useUserCache } from "@/hooks/use-user-cache"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"

export interface ConversationMeta {
  _id: string
  participantIds: string[]
  isGroup?: boolean
  name?: string
  lastMessage?: string
  lastMessageAt?: string
  hasUnread?: boolean
}

interface SidebarProps {
  conversations: ConversationMeta[]
  currentUserId: string | undefined
  activeId?: string
  onConversationCreated?: (conv: ConversationMeta) => void
  onConversationDeleted?: (id: string) => void
  className?: string
}

function SidebarItem({
  conv,
  currentUserId,
  activeId,
  onDelete,
}: {
  conv: ConversationMeta
  currentUserId: string | undefined
  activeId?: string
  onDelete: (e: React.MouseEvent, conv: ConversationMeta) => void
}) {
  const otherUserId = conv.participantIds.find((id) => id !== currentUserId) || "Unknown"
  const isActive = conv._id === activeId
  const [username, setUsername] = useState<string | null>(null)
  const cachedUser = useUserCache((state) => state.users[otherUserId])
  const setUser = useUserCache((state) => state.setUser)

  React.useEffect(() => {
    if (conv.isGroup) {
      setUsername(conv.name || "Groupe")
      return
    }

    if (otherUserId === "Unknown" || !currentUserId) return
    
    // If we already have it in cache, just use it
    if (cachedUser) {
      setUsername(cachedUser.displayName)
      return
    }

    const fetchDetails = async () => {
      let authUsername = null;
      let profileFirstName = null;
      let profileLastName = null;

      try {
        const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"
        const authRes = await fetch(`${AUTH_URL}/users/${otherUserId}`, {
          headers: { "x-user-id": currentUserId, "x-roles": "user" },
        })
        const authData = await authRes.json()
        if (authData.success && authData.data) {
          authUsername = authData.data.username
        }
      } catch (err) {
        console.error(err)
      }

      try {
        const PROFILE_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || "http://localhost:4010"
        const profileRes = await fetch(`${PROFILE_URL}/profiles/${otherUserId}`, {
          headers: { "x-user-id": currentUserId, "x-roles": "user" },
        })
        const profileData = await profileRes.json()
        if (profileData.success && profileData.data) {
          profileFirstName = profileData.data.firstName
          profileLastName = profileData.data.lastName
        }
      } catch (err) {
        console.error(err)
      }

      const nameParts = []
      if (profileFirstName) nameParts.push(profileFirstName)
      if (profileLastName) nameParts.push(profileLastName)
      
      const fullName = nameParts.join(" ")
      const uname = authUsername || `User ${otherUserId.slice(0, 8)}`
      const display = fullName ? `${fullName} @${uname}` : `@${uname}`
      
      setUsername(display)
      setUser(otherUserId, { displayName: display })
    }

    fetchDetails()
  }, [otherUserId, currentUserId, cachedUser, setUser, conv.isGroup, conv.name])

  return (
    <div className="group relative">
      <Link
        href={`/messages/${conv._id}`}
        className={`flex flex-col p-3.5 border-b border-border transition-colors duration-200 pr-10 ${
          isActive
            ? "bg-accent/50 text-foreground"
            : "bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground"
        }`}
      >
        <div className="flex justify-between items-baseline mb-1">
          <div className={`font-semibold text-sm truncate pr-2 ${isActive ? "text-foreground" : "text-foreground"}`}>
            {username ? username : (
              <div className="h-4 w-24 bg-foreground/10 animate-pulse rounded"></div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conv.hasUnread && !isActive && (
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block"></span>
            )}
            {conv.lastMessageAt && (
              <span className="text-xs opacity-70">
                {new Date(conv.lastMessageAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {conv.lastMessage && (
          <p className="text-xs opacity-70 truncate">
            {conv.lastMessage}
          </p>
        )}
      </Link>
      <button
        onClick={(e) => onDelete(e, conv)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-all"
        title="Supprimer la conversation"
      >
        <IconTrash size={16} />
      </button>
    </div>
  )
}

export function ConversationSidebar({ conversations, currentUserId, activeId, onConversationCreated, onConversationDeleted, className = "" }: SidebarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleDeleteConversation = async (e: React.MouseEvent, conv: ConversationMeta) => {
    e.preventDefault()
    e.stopPropagation()
    
    const confirmMessage = conv.isGroup 
      ? "Êtes-vous sûr de vouloir quitter ce groupe ?" 
      : "Êtes-vous sûr de vouloir supprimer cette conversation ?"
      
    if (!window.confirm(confirmMessage)) return

    const conversationId = conv._id
    const API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
    try {
      const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": currentUserId!,
          "x-roles": "user",
        },
      })
      if (res.ok) {
        if (onConversationDeleted) {
          onConversationDeleted(conversationId)
        }
        if (activeId === conversationId) {
          router.push("/messages")
        }
        router.refresh()
      } else {
        alert("Erreur lors de la suppression")
      }
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la suppression")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !currentUserId) return

    const usernamesToFetch = username.split(",").map(u => u.trim()).filter(Boolean)
    if (usernamesToFetch.length === 0) return

    setLoading(true)
    try {
      const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"
      
      const recipientIds: string[] = []
      for (const uname of usernamesToFetch) {
        const authRes = await fetch(`${AUTH_URL}/users/by-username/${uname}`, {
          headers: { "x-user-id": currentUserId, "x-roles": "user" }
        })
        const authData = await authRes.json()

        if (!authData.success || !authData.data) {
          alert(`User not found: ${uname}`)
          setLoading(false)
          return
        }
        recipientIds.push(authData.data.id)
      }

      const conversationData: any = { recipientIds }
      if (usernamesToFetch.length > 1) {
        conversationData.name = usernamesToFetch.join(", ")
      }

      const API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
      const res = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
          "x-roles": "user",
        },
        body: JSON.stringify(conversationData),
      })
      const data = await res.json()
      
      if (data.success && data.data) {
        setOpen(false)
        setUsername("")
        if (onConversationCreated) {
          onConversationCreated(data.data)
        }
        router.push(`/messages/${data.data._id}`)
        // Force refresh the layout to fetch the updated conversation list
        router.refresh()
      } else {
        alert(data.message || "Error creating conversation")
      }
    } catch (err) {
      console.error(err)
      alert("Failed to create conversation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className={`w-full md:w-80 border-r border-border bg-background/50 backdrop-blur-md flex-col h-full ${className}`}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Messages</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button size="icon" variant="ghost" className="rounded-full" title="New conversation">
              <IconPlus size={20} />
            </Button>
          } />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
              <DialogDescription>
                Enter one or multiple usernames separated by commas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <Input
                placeholder="user1, user2..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
                <Button type="submit" disabled={!username.trim() || loading}>
                  {loading ? "Starting..." : "Start Chat"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet.</p>
        ) : (
          conversations.map((conv) => (
            <SidebarItem
              key={conv._id}
              conv={conv}
              currentUserId={currentUserId}
              activeId={activeId}
              onDelete={handleDeleteConversation}
            />
          ))
        )}
      </div>
    </aside>
  )
}
