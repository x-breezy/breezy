"use client"

import React, { useState } from "react"
import Link from "next/link"
import { IconArrowLeft, IconUserPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { AddMemberDialog } from "./add-member-dialog"

interface ConversationHeaderProps {
  conversationId: string
  name: string | null
  isGroup: boolean
  isConnected: boolean
  onRename: (name: string) => Promise<void>
  participantIds: string[]
  currentUserId: string | undefined
}

export function ConversationHeader({
  conversationId,
  name,
  isGroup,
  isConnected,
  onRename,
  participantIds,
  currentUserId,
}: ConversationHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [addMemberOpen, setAddMemberOpen] = useState(false)

  const handleRenameSubmit = async () => {
    if (!editValue.trim() || editValue === name) {
      setIsEditing(false)
      return
    }
    try {
      await onRename(editValue.trim())
    } catch (err) {
      console.error(err)
      setEditValue(name || "")
    } finally {
      setIsEditing(false)
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md md:px-6 dark:border-gray-800 dark:bg-gray-950/80">
      <div className="flex items-center">
        <Link
          href="/messages"
          className="mr-3 -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden dark:hover:bg-gray-800"
        >
          <IconArrowLeft size={20} />
        </Link>
        <div>
          <div className="max-w-[200px] truncate text-lg font-bold md:max-w-[300px]">
            {name === null ? (
              <div className="mt-1 mb-1 h-6 w-32 animate-pulse rounded bg-foreground/10" />
            ) : isEditing ? (
              <input
                autoFocus
                className="w-full border-b border-foreground bg-transparent focus:outline-none"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              />
            ) : (
              <span
                className={
                  isGroup
                    ? "cursor-pointer decoration-gray-400 decoration-dashed underline-offset-4 hover:underline"
                    : ""
                }
                onClick={() => {
                  if (isGroup) {
                    setEditValue(name || "")
                    setIsEditing(true)
                  }
                }}
                title={isGroup ? "Click to rename group" : ""}
              >
                {name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-500">
                <span className="h-2 w-2 rounded-full bg-green-500" /> Online
              </span>
            ) : (
              <span className="text-gray-400">Connecting...</span>
            )}
          </p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full"
        title="Add member"
        onClick={() => setAddMemberOpen(true)}
      >
        <IconUserPlus size={20} />
      </Button>

      <AddMemberDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        conversationId={conversationId}
        isGroup={isGroup}
        participantIds={participantIds}
        currentUserId={currentUserId}
      />
    </header>
  )
}
