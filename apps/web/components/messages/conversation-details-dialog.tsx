"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconUserPlus } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/profile"
import { UsernameDisplay } from "@/components/shared/username-display"
import { NewConversationDialog } from "./new-conversation-dialog"
import { useConversationStore } from "@/stores/conversation-store"
import { mediaUrl } from "@/lib/utils"
import { UserRole } from "@/lib/auth/role"
import type { ParticipantProfile } from "@/lib/actions/conversations"

function MemberRow({
  userId,
  profile,
  currentUserId,
}: {
  userId: string
  profile: ParticipantProfile | undefined
  currentUserId: string | undefined
}) {
  const t = useTranslations("messages")
  const isYou = userId === currentUserId

  if (!profile?.username) {
    return (
      <div className='flex items-center gap-3 px-4 py-3'>
        <ProfileAvatar src={undefined} size='xs' className='size-12 shrink-0' />
        <div className='min-w-0 flex-1'>
          <div className='h-4 w-24 animate-pulse rounded bg-foreground/10' />
        </div>
      </div>
    )
  }

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username
  const avatarSrc = profile.avatarId
    ? profile.avatarId.startsWith("http")
      ? profile.avatarId
      : mediaUrl(profile.avatarId)
    : undefined

  return (
    <Link href={`/profile/${profile.username}`} className='flex items-center gap-3 px-4 py-3'>
      <ProfileAvatar src={avatarSrc} size='xs' className='size-12 shrink-0' />
      <div className='min-w-0 flex-1'>
        <UsernameDisplay
          name={isYou ? `${name} (${t("you")})` : name}
          role={profile.role as UserRole | undefined}
          nameClassName='truncate font-semibold'
          badgeClassName='size-4'
        />
        <p className='truncate text-sm text-muted-foreground'>@{profile.username}</p>
      </div>
    </Link>
  )
}

interface ConversationDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  name: string | null
  isGroup: boolean
  participantIds: string[]
  currentUserId: string | undefined
  participants?: Record<string, ParticipantProfile>
}

export function ConversationDetailsDialog({
  open,
  onOpenChange,
  conversationId,
  name,
  isGroup,
  participantIds,
  currentUserId,
  participants,
}: ConversationDetailsDialogProps) {
  const t = useTranslations("messages")
  const router = useRouter()
  const [groupName, setGroupName] = useState(name || "")
  const [renaming, setRenaming] = useState(false)
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const renameConversation = useConversationStore((s) => s.renameConversation)
  const deleteConversation = useConversationStore((s) => s.deleteConversation)

  const handleRename = async () => {
    if (!groupName.trim() || groupName === name || renaming) return
    setRenaming(true)
    try {
      await renameConversation(conversationId, groupName.trim())
    } catch (err) {
      console.error(err)
      setGroupName(name || "")
    } finally {
      setRenaming(false)
    }
  }

  const doDelete = async () => {
    try {
      await deleteConversation(conversationId)
      onOpenChange(false)
      router.push("/messages")
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          centered
          className='flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm'
        >
          <DialogHeader className='border-b border-border px-5 py-4 pr-12'>
            <DialogTitle className='text-lg font-bold'>{t("details")}</DialogTitle>
          </DialogHeader>

          <div className='flex-1 overflow-y-auto'>
            {isGroup && (
              <section className='border-b border-border px-4 py-4'>
                <p className='mb-2 text-sm text-muted-foreground'>{t("changeGroupName")}</p>
                <div className='flex items-center gap-2'>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRename()}
                    className='flex-1 rounded-lg border border-border bg-transparent px-3 py-1.5 text-sm focus:ring-1 focus:ring-ring focus:outline-none'
                  />
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleRename}
                    disabled={renaming || groupName === name || !groupName.trim()}
                  >
                    {t("change")}
                  </Button>
                </div>
              </section>
            )}

            <section className='border-b border-border'>
              <div className='flex items-center justify-between px-4 py-3'>
                <p className='font-semibold'>{t("members")}</p>
                {isGroup && (
                  <Button
                    size='sm'
                    variant='default'
                    onClick={() => setAddMemberOpen(true)}
                    className='flex items-center gap-1'
                  >
                    <IconUserPlus size={16} />
                    {t("addPeople")}
                  </Button>
                )}
              </div>
              {participantIds.map((uid) => (
                <MemberRow
                  key={uid}
                  userId={uid}
                  profile={participants?.[uid]}
                  currentUserId={currentUserId}
                />
              ))}
            </section>

            <section className='px-4 py-2'>
              <button
                onClick={() => setDeleteOpen(true)}
                className='w-full py-3 text-left text-sm font-medium text-destructive transition-colors hover:opacity-80'
              >
                {t("deleteChat")}
              </button>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <NewConversationDialog
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        conversationId={conversationId}
        participantIds={participantIds}
        currentUserId={currentUserId}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={isGroup ? t("deleteGroupTitle") : t("deleteChatTitle")}
        description={isGroup ? t("deleteGroupDescription") : t("deleteChatDescription")}
        confirmLabel={t("delete")}
        onConfirm={doDelete}
      />
    </>
  )
}
