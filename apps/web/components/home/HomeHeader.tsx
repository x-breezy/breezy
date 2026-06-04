"use client"

import { useRouter } from "next/navigation"
import { Popover } from "@base-ui/react/popover"
import { IconBell, IconCheck, IconChevronDown, IconPlus } from "@tabler/icons-react"

const FEED_OPTIONS = ["For you", "Following", "Trending"]

export function HomeHeader({ feed, onFeedChange }: { feed: string; onFeedChange: (f: string) => void }) {
  const router = useRouter()

  return (
    <header className='sticky top-0 flex h-15 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm'>
      <button
        onClick={() => router.push("/post")}
        className='flex h-8 w-8 items-center justify-center rounded-md bg-muted text-foreground'
      >
        <IconPlus size={18} strokeWidth={2} />
      </button>

      <Popover.Root>
        <Popover.Trigger className='text-md flex items-center gap-1 font-bold outline-none'>
          {feed}
          <IconChevronDown size={14} strokeWidth={2.5} />
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup className='min-w-[140px] overflow-hidden rounded-2xl border bg-background shadow-lg outline-none'>
              {FEED_OPTIONS.map((option) => (
                <Popover.Close
                  key={option}
                  onClick={() => onFeedChange(option)}
                  className='flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted'
                >
                  {option}
                  {feed === option && <IconCheck size={14} strokeWidth={2.5} />}
                </Popover.Close>
              ))}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      <button onClick={() => router.push("/notifications")} className='text-foreground'>
        <IconBell size={22} strokeWidth={1.75} />
      </button>
    </header>
  )
}
