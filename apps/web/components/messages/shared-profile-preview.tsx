"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconLoader2, IconAlertCircle, IconUserPlus } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getProfileByUsernameAction, getIsFollowingAction } from "@/lib/actions/profile-username"
import { followUserAction } from "@/lib/actions/follow"
import { useUserStore } from "@/stores/user-store"
import { mediaUrl } from "@/lib/utils"
import type { Profile } from "@/types/profile"

interface SharedProfilePreviewProps {
  username: string
}

export function SharedProfilePreview({ username }: SharedProfilePreviewProps) {
  const router = useRouter()
  const t = useTranslations("sharedProfilePreview")
  const currentProfileId = useUserStore((s) => s.profile?.profileId)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [following, setFollowing] = useState(false)

  const href = `/profile/${username}`

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const p = await getProfileByUsernameAction(username)
        if (cancelled) return
        setProfile(p)
        if (p) {
          const alreadyFollowing = await getIsFollowingAction(p.profileId)
          if (!cancelled) setIsFollowing(alreadyFollowing)
        }
      } catch (err) {
        console.error("[SharedProfilePreview] Failed to load profile:", err)
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [username])

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!profile || following) return
    setFollowing(true)
    try {
      await followUserAction(profile.profileId)
      setIsFollowing(true)
    } catch (err) {
      console.error("[SharedProfilePreview] Failed to follow:", err)
    } finally {
      setFollowing(false)
    }
  }

  if (loading) {
    return (
      <div className='flex w-64 items-center justify-center rounded-2xl bg-[var(--shared-preview-bg)] p-6'>
        <IconLoader2 size={20} className='animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div
        onClick={() => router.push(href)}
        className='flex w-64 cursor-pointer items-center gap-2 rounded-2xl bg-[var(--shared-preview-bg)] px-4 py-3 text-[var(--shared-preview-fg)]'
      >
        <IconAlertCircle size={16} className='shrink-0 opacity-60' />
        <span className='text-sm opacity-80'>@{username}</span>
      </div>
    )
  }

  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username

  const avatarUrl = profile.avatarId
    ? profile.avatarId.startsWith("http")
      ? profile.avatarId
      : mediaUrl(`/api/media/images/${profile.avatarId}`)
    : undefined

  const isSelf = currentProfileId === profile.profileId
  const showFollowButton = !isSelf && !isFollowing

  return (
    <div className='flex w-64 items-center gap-3 rounded-2xl bg-[var(--shared-preview-bg)] px-4 py-3 text-[var(--shared-preview-fg)] transition-opacity hover:opacity-90 active:opacity-70'>
      <div
        className='flex min-w-0 flex-1 cursor-pointer items-center gap-3'
        onClick={() => router.push(href)}
      >
        <Avatar className='h-10 w-10 shrink-0'>
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className='object-cover' />}
          <AvatarFallback className='bg-primary/10 text-sm font-semibold text-primary'>
            {(displayName?.[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-[var(--shared-preview-fg)]'>
            {displayName}
          </p>
          <p className='truncate text-xs text-muted-foreground'>@{profile.username}</p>
        </div>
      </div>

      {showFollowButton && (
        <Button
          size='sm'
          variant='default'
          className='shrink-0 rounded-full px-3 text-xs'
          onClick={handleFollow}
          disabled={following}
        >
          {following ? (
            <IconLoader2 size={12} className='animate-spin' />
          ) : (
            <IconUserPlus size={12} />
          )}
          {t("follow")}
        </Button>
      )}
    </div>
  )
}
