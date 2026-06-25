"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconBell, IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useNotificationStore } from "@/stores/notification-store"
import { PostComposeDialog } from "@/components/post/create-post/post-compose-dialog"

const FEED_OPTIONS = [
  { value: "following", labelKey: "feedFollowing" },
  { value: "forYou", labelKey: "feedForYou" },
]

interface HomeHeaderProps {
  feed: string
  onFeedChange: (f: string) => void
}

export function HomeHeader({ feed, onFeedChange }: HomeHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("home")
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const composeOpen = searchParams.get("compose") === "post"

  return (
    <PageHeader>
      <PageHeaderContent
        left={
          <Button
            variant='secondary'
            size='icon-lg'
            aria-label={t("createPost")}
            onClick={() => router.push("?compose=post")}
            className='rounded-md'
          >
            <IconPlus className='size-5' strokeWidth={2} />
          </Button>
        }
        center={
          <Select
            value={feed}
            onValueChange={(value) => {
              if (!value) return
              const params = new URLSearchParams(searchParams.toString())
              params.set("feed", value)
              router.push(`?${params}`)
              onFeedChange(value)
            }}
          >
            <SelectTrigger className='h-auto border-0 bg-transparent px-0 py-0 text-xl font-bold capitalize focus-visible:ring-0'>
              <SelectValue>
                {t(
                  (FEED_OPTIONS.find((o) => o.value === feed)?.labelKey ??
                    "feedFollowing") as Parameters<typeof t>[0]
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {FEED_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey as Parameters<typeof t>[0])}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        }
        right={
          <Button
            variant='ghost'
            size='icon-lg'
            aria-label={t("notifications")}
            className='group relative'
            onClick={() => router.push("/notifications")}
          >
            <IconBell className='size-6 group-hover:animate-(--animate-ring)' strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className='absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-background'>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      {composeOpen && <PostComposeDialog onDismiss={() => router.back()} />}
    </PageHeader>
  )
}
