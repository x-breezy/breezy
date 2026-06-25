"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/stores/user-store"
import { useProfileStore } from "@/stores/profile-store"
import { type SearchProfile } from "@/lib/actions/profiles"
import { mediaUrl } from "@/lib/utils"
import { UsernameDisplay } from "@/components/shared/username-display"
import { UserRole } from "@/lib/auth/role"

export function MobileSuggestedUsers({ users }: { users: SearchProfile[] }) {
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const setRelation = useUserStore((s) => s.setRelation)
  const following = useUserStore((s) => s.following)
  const profileFollow = useProfileStore((s) => s.follow)
  const t = useTranslations("sidebar")

  const handleFollow = async (e: React.MouseEvent, user: SearchProfile) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await profileFollow(user.profileId, user.username ?? user.profileId)
      setRelation(user.profileId, true)
      setFollowedIds((prev) => new Set(prev).add(user.profileId))
    } catch {}
  }

  const filteredUsers = users.filter(
    (u) => !followedIds.has(u.profileId) && !following[u.profileId]
  )

  if (filteredUsers.length === 0) return null

  return (
    <div className='px-4 py-3'>
      <p className='mb-2.5 text-sm font-semibold'>{t("whoToFollow")}</p>
      <div className='-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]'>
        {filteredUsers.map((user) => (
          <Link
            href={`/profile/${user.username}`}
            key={user.profileId}
            className='flex w-[108px] shrink-0 flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-center'
          >
            <Avatar size='md'>
              {user.avatarUrl ? (
                <AvatarImage
                  src={
                    user.avatarUrl.startsWith("http") ? user.avatarUrl : mediaUrl(user.avatarUrl)
                  }
                  alt={user.username ?? ""}
                />
              ) : null}
              <AvatarFallback>
                {(user.firstName?.[0] ?? user.username?.[0] ?? "?").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='w-full min-w-0'>
              <UsernameDisplay
                name={
                  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || ""
                }
                role={user.role as UserRole | undefined}
                nameClassName='truncate text-xs font-semibold'
                badgeClassName='size-3.5'
              />
              <p className='truncate text-xs text-muted-foreground'>@{user.username}</p>
            </div>
            <Button
              variant='outline'
              size='xs'
              className='mt-0.5 w-full'
              onClick={(e) => handleFollow(e, user)}
            >
              {t("follow")}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
