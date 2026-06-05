"use client"

import { useRouter } from "next/navigation"
import { IconBell, IconPlus } from "@tabler/icons-react"
import { Button } from "@breezy/ui/components/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@breezy/ui/components/select"

const FEED_OPTIONS = ["For you", "Following", "Trending"]

interface HomeHeaderProps {
  feed: string
  onFeedChange: (f: string) => void
}

export function HomeHeader({ feed, onFeedChange }: HomeHeaderProps) {
  const router = useRouter()

  return (
    <PageHeader>
      <PageHeaderContent
        left={
          <Button
            variant='secondary'
            size='icon-lg'
            aria-label='Create post'
            onClick={() => router.push("/compose/post")}
            className='rounded-md'
          >
            <IconPlus className='size-5' strokeWidth={2} />
          </Button>
        }
        center={
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
        }
        right={
          <>
            <ThemeToggle />
            <Button
              variant='ghost'
              size='icon-lg'
              aria-label='Notifications'
              className='group'
              onClick={() => router.push("/notifications")}
            >
              <IconBell
                className='size-6 group-hover:animate-(--animate-ring)'
                strokeWidth={1.75}
              />
            </Button>
          </>
        }
      />
    </PageHeader>
  )
}
