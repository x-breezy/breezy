"use client"

import { cn } from "@/lib/utils"
import { ProfileEditDialog } from "./edit/profile-edit-dialog"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import {
  IconMessageCircle,
  IconPencilFilled,
  IconUserCheck,
  IconUserPlus,
} from "@tabler/icons-react"
import type { Profile } from "@/types/profile"
import { followUserAction, unfollowUserAction } from "@/app/(app)/profile/follow-action"
import { getIsFollowingAction } from "@/app/(app)/profile/[username]/actions"
import { useProfileStore } from "@/stores/profile-store"
import { useUserStore } from "@/stores/user-store"

interface ProfileActionsProps {
  className?: string
  profile?: Profile
  isOwn?: boolean
}

export function ProfileActions({ className, profile, isOwn }: ProfileActionsProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const updateProfile = useProfileStore((s) => s.update)
  const following = useUserStore((s) => s.following)
  const setRelation = useUserStore((s) => s.setRelation)

  const relationKnown = profile ? profile.profileId in following : false
  const followed = profile ? (following[profile.profileId] ?? false) : false

  useEffect(() => {
    if (isOwn || !profile || relationKnown) return
    getIsFollowingAction(profile.profileId).then((val) => setRelation(profile.profileId, val))
  }, [profile?.profileId, isOwn, relationKnown])

  const handleFollow = async () => {
    if (!profile || pending) return
    setPending(true)
    try {
      if (followed) {
        await unfollowUserAction(profile.profileId)
        updateProfile(profile.username, { followersCount: profile.followersCount - 1 })
        setRelation(profile.profileId, false)
      } else {
        const res = await followUserAction(profile.profileId)
        if (!res.alreadyFollowing) {
          updateProfile(profile.username, { followersCount: profile.followersCount + 1 })
        }
        setRelation(profile.profileId, true)
      }
    } finally {
      setPending(false)
    }
  }

  const handleMessage = () => {}

  return (
    <div className={cn(className, "flex w-full gap-3")}>
      {profile && (
        <ProfileEditDialog open={open} onClose={() => setOpen(false)} profile={profile} />
      )}

      {isOwn && (
        <Button
          variant='secondary'
          className='w-full max-w-40'
          size='lg'
          onClick={() => setOpen(true)}
        >
          Edit Profile
          <IconPencilFilled />
        </Button>
      )}
      {!isOwn && (
        <>
          <Button
            variant={followed ? "secondary" : "default"}
            className='w-full max-w-40 font-semibold'
            size='lg'
            disabled={pending}
            onClick={handleFollow}
          >
            {followed ? <IconUserCheck stroke={2.3} /> : <IconUserPlus stroke={2.3} />}
            {followed ? "Following" : "Follow"}
          </Button>
          <Button
            variant='secondary'
            className='w-full max-w-40 font-semibold'
            size='lg'
            onClick={handleMessage}
          >
            <IconMessageCircle stroke={2.3} />
            Message
          </Button>
        </>
      )}
    </div>
  )
}
