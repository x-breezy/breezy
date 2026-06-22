"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus, IconTrash } from "@tabler/icons-react"
import { useUserCache } from "@/hooks/use-user-cache"
import { useConversationStore, type ConversationMeta } from "@/stores/conversation-store"
import {
  getUserByUsername,
  getUserById,
  getProfileById,
} from "@/lib/actions/conversations"
import { Button } from "@/components/ui/button"
import { TagInput } from "@/components/ui/tag-input"
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

    if (cachedUser) {
      setUsername(cachedUser.displayName)
      return
    }

    const fetchDetails = async () => {
      let authUsername: string | null = null
      let firstName: string | null = null
      let lastName: string | null = null

      try {
        const user = await getUserById(otherUserId)
        authUsername = user.username
      } catch (err) {
        console.error(err)
      }

      try {
        const profile = await getProfileById(otherUserId)
        firstName = profile.firstName
        lastName = profile.lastName
      } catch (err) {
        console.error(err)
      }

      const nameParts = []
      if (firstName) nameParts.push(firstName)
      if (lastName) nameParts.push(lastName)

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
          <div className="font-semibold text-sm truncate pr-2 text-foreground">
            {username ? (
              username
            ) : (
              <div className="h-4 w-24 bg-foreground/10 animate-pulse rounded" />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conv.hasUnread && !isActive && (
              <span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />
            )}
            {conv.lastMessageAt && (
              <span className="text-xs opacity-70">
                {new Date(conv.lastMessageAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {conv.lastMessage && (
          <p className="text-xs opacity-70 truncate">{conv.lastMessage}</p>
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

interface SidebarProps {
  currentUserId: string | undefined
  activeId?: string
  className?: string
}

export function ConversationSidebar({ currentUserId, activeId, className = "" }: SidebarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [usernames, setUsernames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const conversations = useConversationStore((s) => s.conversations)
  const createConversation = useConversationStore((s) => s.createConversation)
  const deleteConversation = useConversationStore((s) => s.deleteConversation)

  const sortedConversations = useMemo(
    () =>
      [...conversations]
        .filter((c) => c.lastMessage)
        .sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return dateB - dateA
        }),
    [conversations]
  )

  const totalUnreadCount = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)

  const handleDeleteConversation = async (e: React.MouseEvent, conv: ConversationMeta) => {
    e.preventDefault()
    e.stopPropagation()

    const confirmMessage = conv.isGroup
      ? "Êtes-vous sûr de vouloir quitter ce groupe ?"
      : "Êtes-vous sûr de vouloir supprimer cette conversation ?"

    if (!window.confirm(confirmMessage)) return

    try {
      await deleteConversation(conv._id)
      if (activeId === conv._id) router.push("/messages")
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Erreur lors de la suppression")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernames.length === 0 || !currentUserId) return

    setLoading(true)
    try {
      const recipientIds: string[] = []
      for (const uname of usernames) {
        try {
          const user = await getUserByUsername(uname)
          recipientIds.push(user.id)
        } catch {
          alert(`User not found: @${uname}`)
          setLoading(false)
          return
        }
      }

      const name = usernames.length > 1 ? usernames.join(", ") : undefined
      const conv = await createConversation(recipientIds, name)

      setOpen(false)
      setUsernames([])
      router.push(`/messages/${conv._id}`)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert("Failed to create conversation")
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside
      className={`w-full md:w-80 border-r border-border bg-background/50 backdrop-blur-md flex-col h-full ${className}`}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight">Messages</h2>
          {totalUnreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 rounded-full h-5 min-w-[1.25rem] flex items-center justify-center">
              {totalUnreadCount}
            </span>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            render={
              <Button size="icon" variant="ghost" className="rounded-full" title="New conversation">
                <IconPlus size={20} />
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
              <DialogDescription>
                Tapez le nom d&apos;utilisateur et appuyez sur Entrée.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <TagInput
                placeholder="Tapez un username et Entrée..."
                tags={usernames}
                setTags={setUsernames}
                disabled={loading}
              />
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
                <Button type="submit" disabled={usernames.length === 0 || loading}>
                  {loading ? "Starting..." : "Start Chat"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet.</p>
        ) : (
          sortedConversations.map((conv) => (
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
