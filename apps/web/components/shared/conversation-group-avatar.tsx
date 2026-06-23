"use client"

import { useUserCache } from "@/hooks/use-user-cache"
import { cn } from "@/lib/utils"
import { ProfileAvatar } from "@/components/profile/profile-avatar"

interface ConversationGroupAvatarProps {
  participantIds: string[]
  totalCount?: number
  className?: string
}

export function ConversationGroupAvatar({
  participantIds,
  totalCount = participantIds.length,
  className,
}: ConversationGroupAvatarProps) {
  const cachedUsers = useUserCache((s) => s.users)
  const shown = participantIds.slice(0, 2)
  const extra = Math.max(0, totalCount - shown.length)

  console.log(shown)

  if (shown.length === 0) return null

  const avatar1 = shown[0] ? cachedUsers[shown[0]] : null
  const avatar2 = shown[1] ? cachedUsers[shown[1]] : null

  return (
    <div className={cn("relative shrink-0 rounded-full", className)}>
      {shown.length === 1 ? (
        <div className='absolute inset-0 flex items-center justify-center'>
          <ProfileAvatar
            src={avatar1?.avatarUrl}
            size='2xs'
            className='rounded-full ring-2 ring-background'
          />
        </div>
      ) : (
        <>
          <div className='absolute top-0 left-2 z-[5] size-[60%]'>
            <ProfileAvatar
              src={avatar1?.avatarUrl}
              size='sm'
              className='size-full rounded-full ring-2 ring-background'
            />
          </div>
          <div className='absolute bottom-0 left-0 z-[3] size-[60%]'>
            <ProfileAvatar
              src={avatar2?.avatarUrl}
              size='sm'
              className='size-full rounded-full ring-2 ring-background'
            />
          </div>
          {extra > 0 && (
            <div className='absolute right-0 bottom-0 z-10 size-[60%]'>
              <div className='flex size-full items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground ring-2 ring-background'>
                +{extra}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
