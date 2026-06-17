"use client"

import { useState, useCallback } from "react"
<<<<<<< HEAD
=======
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
>>>>>>> dev
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "../profile/profile-avatar"
import { UserRole } from "@/lib/auth/role"
import { UsernameDisplay } from "@/components/shared/username-display"

export interface PersonCardProps {
  id: string
  displayName: string | null
  username: string
  avatarUrl: string | undefined
  role?: UserRole
  bio?: string | null
  followersCount?: number
  initialFollowing?: boolean
  onFollow?: (id: string, follow: boolean) => Promise<void>
}

export function PersonCard({
  id,
  displayName,
  username,
  avatarUrl,
  role,
  bio,
  initialFollowing,
  onFollow,
}: PersonCardProps) {
<<<<<<< HEAD
=======
  const t = useTranslations("search")
  const initials = (displayName ?? username ?? "?")[0]?.toUpperCase()
>>>>>>> dev
  const [isFollowing, setIsFollowing] = useState(initialFollowing ?? false)

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
    <div className='person-card flex w-full gap-2.5 bg-background p-3.5 text-left transition-colors select-none active:bg-accent/50'>
      <ProfileAvatar src={avatarUrl} alt={displayName ?? username ?? ""} size='2xs' />
      <div className='min-w-0 flex-1'>
        <UsernameDisplay
          name={displayName ?? username}
          role={role}
          className='truncate'
          nameClassName='text-sm'
        />
        {username && <p className='truncate text-xs text-muted-foreground'>@{username}</p>}
        {bio && <p className='mt-0.5 truncate text-xs text-muted-foreground'>{bio}</p>}
      </div>
      <Button
        size='sm'
        variant={isFollowing ? "secondary" : "default"}
        className='shrink-0'
        onClick={handleFollow}
      >
        {isFollowing ? t("following") : t("follow")}
      </Button>
    </div>
  )
}
