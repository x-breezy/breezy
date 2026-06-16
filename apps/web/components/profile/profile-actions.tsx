"use client"

import { cn } from "@/lib/utils"
import { ProfileEditDialog } from "./edit/profile-edit-dialog"
import { useState } from "react"
import { Button } from "../ui/button"
import {
  IconLoader2,
  IconSend,
  IconPencilFilled,
  IconUserPlus,
  IconUserX,
} from "@tabler/icons-react"
import type { Profile } from "@/types/profile"
import { followUserAction, unfollowUserAction } from "@/app/(app)/profile/follow-action"
import { useProfileStore } from "@/stores/profile-store"
import { useUserStore } from "@/stores/user-store"
import { UnfollowDialog } from "../shared/unfollow-dialog"

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

  const followed = profile ? (following[profile.profileId] ?? false) : false

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

  if (!profile) return null

  return (
    <div className={cn(className, "inline-flex w-full gap-3")}>
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
          {followed && (
            <UnfollowDialog
              username={profile.username}
              onConfirm={handleFollow}
              trigger={
                <Button
                  className='w-full max-w-40 font-semibold'
                  size='lg'
                  variant='secondary'
                  disabled={pending}
                >
                  {pending ? (
                    <IconLoader2 className='animate-spin' stroke={2.3} />
                  ) : (
                    <>
                      <IconUserX stroke={2.3} /> Following
                    </>
                  )}
                </Button>
              }
            />
          )}
          {!followed && (
            <Button
              variant='default'
              className='w-full max-w-40 font-semibold'
              size='lg'
              disabled={pending}
              onClick={handleFollow}
            >
              <IconUserPlus stroke={2.3} /> Follow
            </Button>
          )}
          <Button
            variant='secondary'
            className='w-full max-w-40 font-semibold'
            size='lg'
            onClick={handleMessage}
          >
            <IconSend stroke={2.3} />
            Message
          </Button>
        </>
      )}
    </div>
  )
}
