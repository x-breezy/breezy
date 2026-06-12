"use client"

import { useState, useCallback } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export interface PersonCardProps {
  id: string
  displayName: string | null
  username: string
  avatarUrl: string | null
  bio?: string | null
  followersCount?: number
  onClick: () => void
  onFollow?: (id: string, follow: boolean) => Promise<void>
}

export function PersonCard({
  id,
  displayName,
  username,
  avatarUrl,
  bio,
  onClick,
  onFollow,
}: PersonCardProps) {
  const initials = (displayName ?? username ?? "?")[0]?.toUpperCase()
  const [isFollowing, setIsFollowing] = useState(false)

  const handleFollow = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (!onFollow) return
      const next = !isFollowing
      setIsFollowing(next)
      try {
        await onFollow(id, next)
      } catch {
        setIsFollowing((prev) => !prev)
      }
    },
    [id, isFollowing, onFollow]
  )

  return (
    <div
      onClick={onClick}
      className='person-card flex w-full items-center gap-2.5 border-b border-border bg-background p-3.5 text-left transition-colors select-none active:bg-accent/50'
    >
      <Avatar className='size-11 shrink-0'>
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold'>{displayName ?? username}</p>
        {username && <p className='truncate text-xs text-muted-foreground'>@{username}</p>}
        {bio && <p className='mt-0.5 truncate text-xs text-muted-foreground'>{bio}</p>}
      </div>
      <Button
        size='sm'
        variant={isFollowing ? "outline" : "default"}
        className='shrink-0'
        onClick={handleFollow}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  )
}
