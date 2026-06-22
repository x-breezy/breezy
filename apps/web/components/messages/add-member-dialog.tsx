"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { TagInput } from "@/components/ui/tag-input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { getUserByUsername } from "@/lib/actions/conversations"
import { useConversationStore } from "@/stores/conversation-store"

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  isGroup: boolean
  participantIds: string[]
  currentUserId: string | undefined
}

export function AddMemberDialog({
  open,
  onOpenChange,
  conversationId,
  isGroup,
  participantIds,
  currentUserId,
}: AddMemberDialogProps) {
  const router = useRouter()
  const [usernames, setUsernames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const addMember = useConversationStore((s) => s.addMember)
  const createConversation = useConversationStore((s) => s.createConversation)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (usernames.length === 0 || !currentUserId) return

    setLoading(true)
    try {
      const newMemberIds: string[] = []
      for (const uname of usernames) {
        try {
          const user = await getUserByUsername(uname)
          newMemberIds.push(user.id)
        } catch {
          alert(`User not found: @${uname}`)
          setLoading(false)
          return
        }
      }

      if (isGroup) {
        await addMember(conversationId, newMemberIds)
        onOpenChange(false)
        setUsernames([])
        router.refresh()
      } else {
        const existingMembers = participantIds.filter((id) => id !== currentUserId)
        const conv = await createConversation([...existingMembers, ...newMemberIds])
        onOpenChange(false)
        setUsernames([])
        router.push(`/messages/${conv._id}`)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      alert("Failed to add member(s)")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member(s)</DialogTitle>
          <DialogDescription>
            {isGroup
              ? "Tapez le nom d'utilisateur et appuyez sur Entrée pour l'ajouter au groupe."
              : "Tapez le nom d'utilisateur et appuyez sur Entrée pour créer un nouveau groupe."}
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
              {loading ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
