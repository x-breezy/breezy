"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FollowListDialog } from "./follow-list-dialog"
import type { FollowType } from "./use-follow-list"

interface ProfileStatProps {
  count: number
  label: string
  onClick: () => void
}

function formatCount(count: number): string {
  if (!count) return "0"
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

function ProfileStat({ count, label, onClick }: ProfileStatProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className='flex cursor-pointer items-baseline gap-1 hover:underline'
    >
      <span className='font-semibold'>{formatCount(count)}</span>
      <span className='text-sm'>{label}</span>
    </button>
  )
}

interface ProfileStatsProps {
  profileId: string
  followers: number
  following: number
  className?: string
}

export function ProfileStats({ profileId, followers, following, className }: ProfileStatsProps) {
  const [open, setOpen] = useState<FollowType | null>(null)

  return (
    <>
      <div className={cn("flex items-center gap-3 text-sm", className)}>
        <ProfileStat count={followers} label='followers' onClick={() => setOpen("followers")} />
        <ProfileStat count={following} label='following' onClick={() => setOpen("following")} />
      </div>

      {open && (
        <FollowListDialog
          profileId={profileId}
          type={open}
          open={!!open}
          onOpenChange={(v) => !v && setOpen(null)}
        />
      )}
    </>
  )
}
