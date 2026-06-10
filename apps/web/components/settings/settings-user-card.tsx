"use client"

import { IconChevronRight } from "@tabler/icons-react"
import { ProfileAvatar } from "../profile"
import { Profile } from "@/types/profile"

interface SettingsUserCardProps {
  profile: Profile | null
  onClick?: () => void
}

export function SettingsUserCard({ profile, onClick }: SettingsUserCardProps) {
  return (
    <button
      onClick={onClick}
      className='flex w-full items-center justify-between rounded-3xl bg-input/50 p-3.5 text-left transition'
    >
      <div className='flex items-center gap-3'>
        <ProfileAvatar src={profile?.avatarId || undefined} alt={profile?.username} size='xs' />
        <div className='flex flex-col'>
          <span className='text-sm font-bold text-foreground'>
            {profile?.firstName && profile?.lastName
              ? `${profile?.firstName} ${profile?.lastName}`
              : profile?.username}
          </span>
          <span className='text-xs text-muted-foreground'>@{profile?.username}</span>
        </div>
      </div>
      <IconChevronRight className='pointer-events-none size-4 text-muted-foreground' />
    </button>
  )
}
