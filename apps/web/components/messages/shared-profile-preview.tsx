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
  isOwn: boolean
}

export function SharedProfilePreview({ username, isOwn }: SharedProfilePreviewProps) {
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
      <div
        className={`flex w-64 items-center justify-center rounded-2xl p-6 ${
          isOwn ? "bg-primary/90" : "bg-secondary"
        }`}
      >
        <IconLoader2
          size={20}
          className={`animate-spin ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}
        />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <button
        onClick={() => router.push(href)}
        className={`flex w-64 items-center gap-2 rounded-2xl px-4 py-3 text-left ${
          isOwn ? "bg-primary/90 text-primary-foreground" : "bg-secondary text-foreground"
        }`}
      >
        <IconAlertCircle size={16} className='shrink-0 opacity-60' />
        <span className='text-sm opacity-80'>@{username}</span>
      </button>
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
    <button
      onClick={() => router.push(href)}
      className={`flex w-64 items-center gap-3 rounded-2xl px-4 py-3 text-left transition-opacity hover:opacity-90 active:opacity-70 ${
        isOwn ? "bg-primary/90 text-primary-foreground" : "bg-secondary text-foreground"
      }`}
    >
      <Avatar className='h-10 w-10 shrink-0'>
        {avatarUrl && (
          <AvatarImage src={avatarUrl} alt={displayName} className='object-cover' />
        )}
        <AvatarFallback
          className={`text-sm font-semibold ${
            isOwn
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {(displayName?.[0] ?? "?").toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1'>
        <p
          className={`truncate text-sm font-semibold ${
            isOwn ? "text-primary-foreground" : "text-foreground"
          }`}
        >
          {displayName}
        </p>
        <p
          className={`truncate text-xs ${
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          @{profile.username}
        </p>
      </div>

      {showFollowButton && (
        <Button
          size='sm'
          variant={isOwn ? "secondary" : "default"}
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
    </button>
  )
}
