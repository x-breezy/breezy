"use client"

import Image from "next/image"
import { IconChevronRight } from "@tabler/icons-react"

interface SettingsUserCardProps {
  name: string
  username: string
  avatarUrl?: string
  onClick?: () => void
}

export function SettingsUserCard({ name, username, avatarUrl, onClick }: SettingsUserCardProps) {
  const initial = name.charAt(0) || "?"

  return (
    <button
      onClick={onClick}
      className='flex w-full items-center justify-between rounded-3xl bg-muted p-3.5 text-left transition active:bg-accent/50'
    >
      <div className='flex items-center gap-3'>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={name}
            width={48}
            height={48}
            className='h-12 w-12 flex-shrink-0 rounded-full object-cover'
          />
        ) : (
          <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted-foreground/20 text-base font-bold text-muted-foreground uppercase'>
            {initial}
          </div>
        )}
        <div className='flex flex-col'>
          <span className='text-sm font-bold text-foreground'>{name}</span>
          <span className='text-xs text-muted-foreground'>@{username}</span>
        </div>
      </div>
      <IconChevronRight className='h-4 w-4 text-foreground' />
    </button>
  )
}
