"use client"

import { useRouter } from "next/navigation"
import { IconChevronLeft } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface NotificationsHeaderProps {
  className?: string
}

export function NotificationsHeader({ className }: NotificationsHeaderProps) {
  const router = useRouter()

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-110 bg-background/80 px-4 backdrop-blur-sm lg:left-64",
        className
      )}
    >
      <div className='flex h-15 items-center gap-2'>
        <button aria-label='Back' onClick={() => router.back()} className='text-foreground'>
          <IconChevronLeft size={22} strokeWidth={2} />
        </button>
        <h1 className='text-lg font-bold'>Notifications</h1>
      </div>
    </header>
  )
}
