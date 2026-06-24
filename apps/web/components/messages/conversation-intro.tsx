"use client"

import React from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { ProfileAvatar } from "@/components/profile"
import { ConversationGroupAvatar } from "@/components/shared/conversation-group-avatar"
import { UsernameDisplay } from "@/components/shared/username-display"
import { UserRole } from "@/lib/auth/role"

interface ConversationIntroProps {
  displayName: string | null
  role?: string | null
  avatarUrl?: string
  isGroup: boolean
  memberCount: number
  participantIds: string[]
  currentUserId: string | undefined
}

export function ConversationIntro({
  displayName,
  role,
  avatarUrl,
  isGroup,
  memberCount,
  participantIds,
  currentUserId,
}: ConversationIntroProps) {
  const t = useTranslations("messages")

  if (!displayName) return null

  if (!isGroup) {
    const atIdx = displayName.lastIndexOf(" @")
    const name = atIdx >= 0 ? displayName.slice(0, atIdx) : displayName
    const handle = atIdx >= 0 ? displayName.slice(atIdx + 2) : null

    return (
      <div className='flex flex-col items-center gap-3 py-10 text-center'>
        <ProfileAvatar src={avatarUrl} size='lg' />
        <div className='space-y-0.5'>
          <UsernameDisplay
            name={name}
            role={role as UserRole | undefined}
            nameClassName='text-base font-bold'
            badgeClassName='size-5'
          />
          {handle && <p className='text-sm text-muted-foreground'>@{handle}</p>}
        </div>
        {handle && (
          <Link
            href={`/profile/${handle}`}
            className='rounded-full border border-border px-5 py-1.5 text-sm font-semibold transition-colors hover:bg-accent'
          >
            {t("viewProfile")}
          </Link>
        )}
      </div>
    )
  }

  const visibleIds = participantIds.filter((id) => id !== currentUserId)

  return (
    <div className='flex flex-col items-center gap-3 py-10 text-center'>
      <ConversationGroupAvatar
        participantIds={visibleIds}
        totalCount={visibleIds.length}
        className='size-14'
      />
      <div className='space-y-0.5'>
        <p className='text-base font-bold'>{displayName}</p>
        <p className='text-sm text-muted-foreground'>{t("membersCount", { count: memberCount })}</p>
      </div>
    </div>
  )
}
