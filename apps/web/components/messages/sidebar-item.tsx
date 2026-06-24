"use client"

import React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { IconTrash } from "@tabler/icons-react"
import { useUserCache } from "@/hooks/use-user-cache"
import { type ConversationMeta } from "@/stores/conversation-store"
import { Button } from "@/components/ui/button"
import { ConversationGroupAvatar } from "@/components/shared/conversation-group-avatar"
import { ProfileAvatar } from "@/components/profile"
import { UsernameDisplay } from "@/components/shared/username-display"
import { UserRole } from "@/lib/auth/role"
import { timeAgo, mediaUrl } from "@/lib/utils"

interface SidebarItemProps {
  conv: ConversationMeta
  currentUserId: string | undefined
  activeId?: string
  onDelete: (e: React.MouseEvent, conv: ConversationMeta) => void
}

export function SidebarItem({ conv, currentUserId, activeId, onDelete }: SidebarItemProps) {
  const t = useTranslations("messages")
  const isActive = conv._id === activeId
  const cachedUsers = useUserCache((state) => state.users)

  const visibleIds = conv.participantIds.filter((id) => id !== currentUserId)
  const otherUserId = visibleIds[0] ?? "Unknown"

  const otherProfile = conv.participants?.[otherUserId]

  const displayName = (() => {
    if (conv.isGroup) return conv.name || t("group")
    if (!otherProfile) {
      const cached = cachedUsers[otherUserId]
      if (cached) return cached.displayName.split(" @")[0] || cached.displayName
      return null
    }
    const nameParts = [otherProfile.firstName, otherProfile.lastName].filter(Boolean)
    return nameParts.join(" ") || otherProfile.username || null
  })()

  const avatarUrl = (() => {
    if (conv.isGroup) return undefined
    const id = otherProfile?.avatarId ?? cachedUsers[otherUserId]?.avatarUrl
    return id ? (id.startsWith("http") ? id : mediaUrl(id)) : undefined
  })()

  const lastSenderProfile =
    conv.lastMessageSenderId && conv.lastMessageSenderId !== currentUserId
      ? (conv.participants?.[conv.lastMessageSenderId] ?? null)
      : null

  const lastSenderName = lastSenderProfile
    ? [lastSenderProfile.firstName, lastSenderProfile.lastName].filter(Boolean).join(" ") ||
      lastSenderProfile.username ||
      (() => {
        const cached = cachedUsers[conv.lastMessageSenderId!]
        return cached ? cached.displayName.split(" @")[0] : null
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
          <ProfileAvatar src={avatarUrl} size='xs' className='size-12 shrink-0' />
        )}

        <div className='min-w-0 flex-1'>
          <div className='flex items-center justify-between gap-2'>
            <div className='min-w-0 flex-1'>
              {displayName !== null ? (
                conv.isGroup ? (
                  <span className='truncate text-sm font-semibold text-foreground'>
                    {displayName}
                  </span>
                ) : (
                  <UsernameDisplay
                    name={displayName}
                    role={otherProfile?.role as UserRole | undefined}
                    nameClassName='truncate text-sm font-semibold text-foreground'
                    badgeClassName='size-4'
                  />
                )
              ) : (
                <span className='inline-block h-4 w-24 animate-pulse rounded bg-foreground/10' />
              )}
            </div>
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
