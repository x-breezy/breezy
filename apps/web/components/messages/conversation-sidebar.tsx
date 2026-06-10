"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconPlus } from "@tabler/icons-react"
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
  lastMessage?: string
  lastMessageAt?: string
}

interface SidebarProps {
  conversations: ConversationMeta[]
  currentUserId: string | undefined
  activeId?: string
}

export function ConversationSidebar({ conversations, currentUserId, activeId }: SidebarProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !currentUserId) return

    setLoading(true)
    try {
      const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"
      const authRes = await fetch(`${AUTH_URL}/users/by-username/${username.trim()}`, {
        headers: { "x-user-id": currentUserId, "x-roles": "user" }
      })
      const authData = await authRes.json()

      if (!authData.success || !authData.data) {
        alert("User not found")
        setLoading(false)
        return
      }

      const recipientId = authData.data.id

      const API_URL = process.env.NEXT_PUBLIC_MESSAGE_API_URL || "http://localhost:4030"
      const res = await fetch(`${API_URL}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUserId,
          "x-roles": "user",
        },
        body: JSON.stringify({ recipientId }),
      })
      const data = await res.json()
      
      if (data.success && data.data) {
        setOpen(false)
        setUsername("")
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
    <aside className="w-80 border-r border-border bg-background/50 backdrop-blur-md flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Messages</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="icon" variant="ghost" className="rounded-full" title="New conversation" />}>
            <IconPlus size={20} />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
              <DialogDescription>
                Enter the username of the person you want to chat with.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <Input
                placeholder="Username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <DialogFooter>
                <DialogClose render={<Button type="button" variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={!username.trim() || loading}>
                  {loading ? "Starting..." : "Start Chat"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">No conversations yet.</p>
        ) : (
          conversations.map((conv) => {
            const otherUserId = conv.participantIds.find((id) => id !== currentUserId) || "Unknown"
            const isActive = conv._id === activeId

            return (
              <Link
                key={conv._id}
                href={`/messages/${conv._id}`}
                className={`flex flex-col p-3 rounded-2xl transition-colors duration-200 ${
                  isActive
                    ? "bg-primary/10 border border-primary/20 text-foreground"
                    : "hover:bg-muted border border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`font-semibold text-sm truncate ${isActive ? "text-foreground" : "text-foreground"}`}>User {otherUserId.slice(0, 8)}</span>
                  {conv.lastMessageAt && (
                    <span className="text-xs opacity-70">
                      {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {conv.lastMessage && (
                  <p className="text-xs opacity-70 truncate">
                    {conv.lastMessage}
                  </p>
                )}
              </Link>
            )
          })
        )}
      </div>
    </aside>
  )
}
