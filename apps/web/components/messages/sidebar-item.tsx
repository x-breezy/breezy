"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { IconTrash } from "@tabler/icons-react"
import { useUserCache } from "@/hooks/use-user-cache"
import { type ConversationMeta } from "@/stores/conversation-store"
import { getUserById, getProfileById } from "@/lib/actions/conversations"
import { Button } from "@/components/ui/button"
import { ConversationGroupAvatar } from "@/components/shared/conversation-group-avatar"
import { ProfileAvatar } from "@/components/profile"
import { timeAgo } from "@/lib/utils"

interface SidebarItemProps {
  conv: ConversationMeta
  currentUserId: string | undefined
  activeId?: string
  onDelete: (e: React.MouseEvent, conv: ConversationMeta) => void
}

export function SidebarItem({ conv, currentUserId, activeId, onDelete }: SidebarItemProps) {
  const t = useTranslations("messages")
  const otherUserId = conv.participantIds.find((id) => id !== currentUserId) || "Unknown"
  const isActive = conv._id === activeId
  const cachedUsers = useUserCache((state) => state.users)
  const cachedUser = cachedUsers[otherUserId]
  const setUser = useUserCache((state) => state.setUser)

  const initDisplayName = () => {
    if (conv.isGroup) return conv.name || t("group")
    if (otherUserId === "Unknown" || !currentUserId) return null
    if (cachedUser) {
      const parts = cachedUser.displayName.split(" @")
      return parts[0] || cachedUser.displayName
    }
    return null
  }
  const [displayName, setDisplayName] = useState<string | null>(initDisplayName)

  const visibleIds = conv.participantIds.filter((id) => id !== currentUserId)

  useEffect(() => {
    if (conv.isGroup) return
    if (otherUserId === "Unknown" || !currentUserId || displayName) return

    const fetchDetails = async () => {
      let authUsername: string | null = null
      let firstName: string | null = null
      let lastName: string | null = null
      let avatarUrl: string | undefined

      try {
        const user = await getUserById(otherUserId)
        authUsername = user.username
      } catch {
        /* noop */
      }

      try {
        const profile = await getProfileById(otherUserId)
        firstName = profile.firstName
        lastName = profile.lastName
        if (profile.avatarId) avatarUrl = profile.avatarId
      } catch {
        /* noop */
      }

      const nameParts = []
      if (firstName) nameParts.push(firstName)
      if (lastName) nameParts.push(lastName)
      const fullName = nameParts.join(" ")
      const uname = authUsername || t("userFallback", { id: otherUserId.slice(0, 8) })
      const display = fullName ? `${fullName} @${uname}` : `@${uname}`

      const parts = display.split(" @")
      setDisplayName(parts[0] || display)
      setUser(otherUserId, { displayName: display, avatarUrl })
    }

    fetchDetails()
  }, [otherUserId, currentUserId, cachedUser, setUser, conv.isGroup, displayName, t])

  // Fetch profile details for all group participants (for avatars and sender name)
  useEffect(() => {
    if (!conv.isGroup || !currentUserId) return

    const ids = conv.participantIds.filter((id) => id !== currentUserId)
    const uncached = ids.filter((id) => !cachedUsers[id])

    if (uncached.length === 0) return

    const fetchGroupMembers = async () => {
      for (const id of uncached) {
        try {
          const [user, profile] = await Promise.allSettled([getUserById(id), getProfileById(id)])

          let displayName = ""
          let avatarUrl: string | undefined

          if (profile.status === "fulfilled") {
            const nameParts = [profile.value.firstName, profile.value.lastName].filter(Boolean)
            displayName = nameParts.join(" ")
            if (profile.value.avatarId) avatarUrl = profile.value.avatarId
          }

          if (user.status === "fulfilled") {
            const fullDisplay = displayName
              ? `${displayName} @${user.value.username}`
              : `@${user.value.username}`
            setUser(id, { displayName: fullDisplay, avatarUrl })
          } else if (displayName) {
            setUser(id, { displayName, avatarUrl })
          }
        } catch {
          /* noop */
        }
      }
    }

    fetchGroupMembers()
  }, [conv.isGroup, conv.participantIds, currentUserId, cachedUsers, setUser])

  // Resolve sender display name from cache
  const lastSenderName =
    conv.lastMessageSenderId && conv.lastMessageSenderId !== currentUserId
      ? (() => {
          const sender = cachedUsers[conv.lastMessageSenderId]
          if (!sender) return null
          const parts = sender.displayName.split(" @")
          return parts[0] || sender.displayName
        })()
      : null

  const showSenderPrefix = conv.isGroup && lastSenderName && conv.lastMessage

  return (
    <div className='group relative'>
      <Link
        href={`/messages/${conv._id}`}
        className={`flex items-center gap-3 px-4 py-3 pr-10 transition-colors ${
          isActive ? "bg-accent" : "hover:bg-accent/50"
        }`}
      >
        {conv.isGroup ? (
          <ConversationGroupAvatar
            participantIds={visibleIds}
            totalCount={visibleIds.length}
            className='size-12'
          />
        ) : (
          <ProfileAvatar src={cachedUser?.avatarUrl} size='xs' className='size-12 shrink-0' />
        )}

        <div className='min-w-0 flex-1'>
          <div className='flex items-center justify-between gap-2'>
            <span className='truncate text-sm font-semibold text-foreground'>
              {displayName !== null ? (
                displayName
              ) : (
                <span className='inline-block h-4 w-24 animate-pulse rounded bg-foreground/10' />
              )}
            </span>
            <div className='flex shrink-0 items-center gap-1.5'>
              {conv.hasUnread && !isActive && <span className='h-2 w-2 rounded-full bg-primary' />}
              {conv.lastMessageAt && (
                <span className='text-xs text-muted-foreground'>{timeAgo(conv.lastMessageAt)}</span>
              )}
            </div>
          </div>
          {conv.lastMessage && (
            <p className='truncate text-xs text-muted-foreground'>
              {showSenderPrefix && (
                <span className='font-medium text-foreground/80'>{lastSenderName}: </span>
              )}
              {conv.lastMessage}
            </p>
          )}
        </div>
      </Link>

      <Button
        onClick={(e) => onDelete(e, conv)}
        variant='destructive'
        size='icon-sm'
        className='absolute top-1/2 right-3 -translate-y-1/2! rounded-full opacity-0 group-hover:opacity-100'
        title={t("deleteChat")}
      >
        <IconTrash size={16} />
      </Button>
    </div>
  )
}
