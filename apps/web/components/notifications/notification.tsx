"use client"

import { IconDots } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Notification } from "@/types/notification"
import { useNotificationStore } from "@/stores/notification-store"

function getActorId(notification: Notification): string {
  return notification.payload.actorId ?? notification.payload.followerId ?? ""
}

function getNotificationMessage(notification: Notification): string {
  switch (notification.type) {
    case "follow":
      return "started following you"
    case "like":
      return "liked your post"
    case "mention":
      return "mentioned you in a post"
  }
}

function getTypeColor(notification: Notification): string {
  switch (notification.type) {
    case "follow":
      return "bg-sky-600"
    case "like":
      return "bg-violet-600"
    case "mention":
      return "bg-rose-500"
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return "now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d`
  return new Date(dateStr).toLocaleDateString()
}

interface Props {
  notification: Notification
  wasNew: boolean
}

export function NotificationItem({ notification, wasNew }: Props) {
  const remove = useNotificationStore((s) => s.remove)
  const actorId = getActorId(notification)
  const message = getNotificationMessage(notification)
  const time = formatRelativeTime(notification.createdAt)
  const color = getTypeColor(notification)
  const avatarUrl = `https://api.dicebear.com/10.x/glyphs/svg?seed=${actorId}`

  return (
    <li className={`container-center flex gap-3 border-b px-4 py-4 ${wasNew ? "bg-muted/30" : ""}`}>
      <Avatar>
        <AvatarImage src={avatarUrl} alt={actorId} />
        <AvatarFallback className={color}>{actorId.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className='w-full flex-1'>
        <div className='flex items-center justify-between gap-2'>
          <p className='text-sm'>
            {wasNew && (
              <span className='mr-1.5 inline-block size-2 rounded-full bg-primary align-middle' />
            )}
            <span className='font-semibold'>@{actorId}</span>
            <span className='text-muted-foreground'> &middot; {time}</span>
          </p>
          <Button
            variant='ghost'
            size='icon-sm'
            aria-label='Delete notification'
            className='shrink-0 text-muted-foreground'
            onClick={() => remove(notification._id)}
          >
            <IconDots size={16} />
          </Button>
        </div>
        <p className='mt-0.5 text-sm text-muted-foreground'>{message}</p>
      </div>
    </li>
  )
}
