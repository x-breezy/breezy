"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { IconArrowLeft, IconDots } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { ConversationGroupAvatar } from "@/components/shared/conversation-group-avatar"
import { ConversationDetailsDialog } from "./conversation-details-dialog"
import Link from "next/link"

interface ConversationHeaderProps {
  conversationId: string
  name: string | null
  isGroup: boolean
  participantIds: string[]
  currentUserId: string | undefined
}

export function ConversationHeader({
  conversationId,
  name,
  isGroup,
  participantIds,
  currentUserId,
}: ConversationHeaderProps) {
  const t = useTranslations("messages")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const visibleIds = participantIds.filter((id) => id !== currentUserId)

  const displayName = name ? (isGroup ? name : name.split(" @")[0]) : null

  return (
    <>
      <header className='sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6'>
        <div className='flex items-center gap-3'>
          <Link
            href='/messages'
            className='mr-3 -ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 md:hidden dark:hover:bg-gray-800'
          >
            <IconArrowLeft size={20} />
          </Link>
          <ConversationGroupAvatar
            participantIds={visibleIds}
            totalCount={visibleIds.length}
            className='size-10'
          />
          <div className='max-w-[200px] truncate font-semibold md:max-w-[300px]'>
            {displayName === null ? (
              <div className='h-4 w-32 animate-pulse rounded bg-foreground/10' />
            ) : (
              displayName
            )}
          </div>
        </div>

        <Button
          variant='ghost'
          size='icon'
          className='rounded-full'
          title={t("details")}
          onClick={() => setDetailsOpen(true)}
        >
          <IconDots size={20} />
        </Button>
      </header>

      <ConversationDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        conversationId={conversationId}
        name={name}
        isGroup={isGroup}
        participantIds={participantIds}
        currentUserId={currentUserId}
      />
    </>
  )
}
