"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUserStore } from "@/stores/user-store"
import { useProfileStore } from "@/stores/profile-store"
import { type SearchProfile } from "@/lib/api/search"
import { mediaUrl } from "@/lib/utils"
import { IconUserPlus } from "@tabler/icons-react"

export function SidebarSuggestedUsers({ users }: { users: SearchProfile[] }) {
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set())
  const setRelation = useUserStore((s) => s.setRelation)
  const following = useUserStore((s) => s.following)
  const profileFollow = useProfileStore((s) => s.follow)
  const t = useTranslations("sidebar")

  const handleFollow = async (user: SearchProfile) => {
    try {
      await profileFollow(user.profileId, user.username ?? user.profileId)
      setRelation(user.profileId, true)
      setFollowedIds((prev) => new Set(prev).add(user.profileId))
    } catch {
      // silently fail
    }
  }

  const filteredUsers = users.filter(
    (u) => !followedIds.has(u.profileId) && !following[u.profileId]
  )

  if (filteredUsers.length === 0) return null

  return (
    <div className='overflow-hidden rounded-2xl border bg-card'>
      <div className='flex items-center justify-between px-4 pt-4 pb-2'>
        <h2 className='text-lg font-bold'>{t("whoToFollow")}</h2>
        <IconUserPlus className='size-5 text-muted-foreground' stroke={2} />
      </div>
      <div className='flex flex-col'>
        {filteredUsers.map((user) => (
          <div
            key={user.profileId}
            className='flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50'
          >
            <Link href={`/profile/${user.username}`} className='shrink-0'>
              <Avatar size='sm'>
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
            </Link>
            <Link href={`/profile/${user.username}`} className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold'>
                {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.username}
              </p>
              <p className='truncate text-xs text-muted-foreground'>@{user.username}</p>
            </Link>
            <Button variant='outline' size='xs' onClick={() => handleFollow(user)}>
              {t("follow")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
