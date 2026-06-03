"use client"

import { useRouter } from "next/navigation"
import { IconChevronLeft } from "@tabler/icons-react"

export function NotificationsHeader() {
  const router = useRouter()

  return (
    <header className='sticky top-0 z-10 flex h-15 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-sm'>
      <button onClick={() => router.back()} className='text-foreground'>
        <IconChevronLeft size={22} strokeWidth={2} />
      </button>
      <h1 className='text-lg font-bold'>Notifications</h1>
    </header>
  )
}
