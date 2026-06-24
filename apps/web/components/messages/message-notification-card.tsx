"use client"

import { useRouter } from "next/navigation"
import { IconMessage } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { ProfileAvatar } from "@/components/profile/profile-avatar"

interface MessageNotificationCardProps {
  senderName: string
  senderAvatar?: string
  conversationName?: string
  preview: string
  conversationId: string
  onDismiss: () => void
  className?: string
}

export function MessageNotificationCard({
  senderName,
  senderAvatar,
  conversationName,
  preview,
  conversationId,
  onDismiss,
  className,
}: MessageNotificationCardProps) {
  const router = useRouter()

  function handleClick() {
    router.push(`/messages/${conversationId}`)
    onDismiss()
  }

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className={cn("flex cursor-pointer gap-3 rounded-lg px-2 py-2 hover:bg-muted", className)}
    >
      <div className='relative shrink-0'>
        <ProfileAvatar src={senderAvatar ?? ""} alt={senderName} size='2xs' />
        <span className='absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-white ring-2 ring-background'>
          <IconMessage size={13} stroke={2.3} />
        </span>
      </div>

      <div className='flex w-full flex-1 flex-col justify-center gap-0.5'>
        <p className='text-sm leading-snug font-semibold'>
          {conversationName ? `${senderName} in ${conversationName}` : senderName}
        </p>
        <p className='line-clamp-2 text-xs text-muted-foreground'>{preview}</p>
      </div>
    </div>
  )
}
