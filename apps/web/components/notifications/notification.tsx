"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  IconHeartFilled,
  IconUserPlus,
  IconAt,
  IconMessage,
  IconLoader2,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Notification } from "@/types/notification"
import type { ActorInfo, NotificationView } from "@/lib/notifications/group"
import { followUserAction, unfollowUserAction } from "@/app/(app)/profile/follow-action"
import { useUserStore } from "@/stores/user-store"
import { ProfileAvatar } from "../profile/profile-avatar"
import { UnfollowDialog } from "@/components/shared/unfollow-dialog"

export function getActorId(notification: Notification): string {
  return notification.payload.actorId ?? notification.payload.followerId ?? ""
}

export function formatRelativeTime(dateStr: string): string {
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

export const notificationTypeMeta = {
  like: { Icon: IconHeartFilled, badge: "bg-rose-500", stroke: 0 },
  follow: { Icon: IconUserPlus, badge: "bg-sky-500", stroke: 2.4 },
  mention: { Icon: IconAt, badge: "bg-violet-500", stroke: 2.3 },
  comment: { Icon: IconMessage, badge: "bg-amber-500", stroke: 2.3 },
} as const

function NotificationText({ view }: { view: NotificationView }) {
  const uname = (actor: ActorInfo) => <span className='font-semibold'>{actor.username}</span>

  if (view.kind === "follow") {
    return (
      <>
        {uname(view.actor)}
        <span className='text-foreground'> started following you.</span>
      </>
    )
  }

  if (view.kind === "mention") {
    return (
      <>
        {uname(view.actor)}
        <span className='text-foreground'> mentioned you in a post.</span>
      </>
    )
  }

  if (view.kind === "comment") {
    return (
      <>
        {uname(view.actor)}
        <span className='text-foreground'> commented on your post.</span>
      </>
    )
  }

  const { actors } = view
  const rest = actors.length - 2

  if (actors.length === 1) {
    return (
      <>
        {uname(actors[0]!)}
        <span className='text-foreground'> liked your post.</span>
      </>
    )
  }
  if (actors.length === 2) {
    return (
      <>
        {uname(actors[0]!)}
        <span className='text-foreground'> and </span>
        {uname(actors[1]!)}
        <span className='text-foreground'> liked your post.</span>
      </>
    )
  }
  return (
    <>
      {uname(actors[0]!)}
      <span className='text-foreground'>, </span>
      {uname(actors[1]!)}
      <span className='text-foreground'> and {rest} more liked your post.</span>
    </>
  )
}

interface CardProps {
  view: NotificationView
  onDismiss: () => void
  highlight?: boolean
  className?: string
}

export function NotificationCard({ view, highlight, className }: CardProps) {
  const router = useRouter()
  const actorId = view.kind === "follow" ? view.actor.id : ""
  const followed = useUserStore((s) => s.following[actorId] ?? false)
  const setRelation = useUserStore((s) => s.setRelation)
  const [isPending, startTransition] = useTransition()

  const primaryActor =
    view.kind === "like" ? (view.actors[0] ?? { id: "", username: "", avatarId: null }) : view.actor
  const { Icon, badge, stroke } = notificationTypeMeta[view.kind]

  function handleCardClick() {
    const currentUsername = useUserStore.getState().profile?.username
    if (view.kind === "follow") {
      router.push(`/profile/${view.actor.username}`)
    } else if (view.kind === "mention") {
      router.push(`/post/${view.actor.username}/${view.postId}`)
    } else {
      if (currentUsername) router.push(`/post/${currentUsername}/${view.postId}`)
    }
  }

  function handleFollowBack(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      try {
        await followUserAction(actorId)
        setRelation(actorId, true)
      } catch {
        // no-op
      }
    })
  }

  function handleUnfollow() {
    startTransition(async () => {
      try {
        await unfollowUserAction(actorId)
        setRelation(actorId, false)
      } catch {
        // no-op
      }
    })
  }

  const time = formatRelativeTime(view.createdAt)

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      className={cn(
        "flex cursor-pointer gap-3 rounded-lg px-2 py-2 hover:bg-muted",
        highlight && "bg-muted/30",
        className
      )}
    >
      <div className='relative shrink-0'>
        <ProfileAvatar src={primaryActor.avatarId ?? ""} alt={primaryActor.username} size='2xs' />
        <span
          className={cn(
            "absolute -right-0.5 -bottom-0.5 flex size-5 items-center justify-center rounded-full text-white ring-2 ring-background",
            badge
          )}
        >
          <Icon size={13} stroke={stroke} />
        </span>
      </div>

      <div className='flex w-full flex-1 items-center justify-between gap-2'>
        <p className='text-sm leading-snug'>
          {highlight && (
            <span className='mr-1.5 inline-block size-2 rounded-full bg-primary align-middle' />
          )}
          <NotificationText view={view} />
          <span className='ml-1 text-xs text-muted-foreground'> {time}</span>
        </p>
        {view.kind === "follow" &&
          (followed ? (
            <UnfollowDialog
              username={view.actor.username}
              onConfirm={handleUnfollow}
              trigger={
                <Button className='min-w-24' variant='secondary' disabled={isPending}>
                  {isPending ? <IconLoader2 className='animate-spin' stroke={2.3} /> : "Following"}
                </Button>
              }
            />
          ) : (
            <Button className='min-w-24' disabled={isPending} onClick={handleFollowBack}>
              {isPending ? <IconLoader2 className='animate-spin' stroke={2.3} /> : "Follow"}
            </Button>
          ))}
      </div>
    </div>
  )
}
