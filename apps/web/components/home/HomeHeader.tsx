"use client"

import { useRouter } from "next/navigation"
import { IconBell, IconPlus } from "@tabler/icons-react"
import { Button } from "@breezy/ui/components/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@breezy/ui/components/select"

const FEED_OPTIONS = ["For you", "Following", "Trending"]

export function HomeHeader({
  feed,
  onFeedChange,
}: {
  feed: string
  onFeedChange: (f: string) => void
}) {
  const router = useRouter()

  return (
    <header className='sticky top-0 flex h-15 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm'>
      <Button
        variant='secondary'
        size='icon-lg'
        aria-label='Create post'
        onClick={() => router.push("/compose/post")}
        className='rounded-md'
      >
        <IconPlus className='size-5' strokeWidth={2} />
      </Button>

      <Select value={feed} onValueChange={(v) => v && onFeedChange(v)}>
        <SelectTrigger className='border-transparent bg-transparent px-0 text-xl font-bold shadow-none focus-visible:ring-0'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent side='bottom'>
          <SelectGroup>
            {FEED_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Button
        variant='ghost'
        size='icon-lg'
        aria-label='Notifications'
        onClick={() => router.push("/notifications")}
      >
        <IconBell className='size-6' strokeWidth={1.75} />
      </Button>
    </header>
  )
}
