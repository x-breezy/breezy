"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { getTrendingTags, type TrendingTag } from "@/lib/api/search"
import { IconTrendingUp } from "@tabler/icons-react"

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function SidebarTrending() {
  const [tags, setTags] = useState<TrendingTag[]>([])
  const t = useTranslations("sidebar")

  useEffect(() => {
    getTrendingTags(5)
      .then(setTags)
      .catch(() => {})
  }, [])

  if (tags.length === 0) return null

  return (
    <div className='overflow-hidden rounded-2xl border bg-card'>
      <div className='flex items-center justify-between px-4 pt-4 pb-2'>
        <h2 className='text-lg font-bold'>{t("trendsForYou")}</h2>
        <IconTrendingUp className='size-5 text-muted-foreground' stroke={2} />
      </div>
      <div className='flex flex-col'>
        {tags.map((tag) => (
          <Link
            key={tag.tag}
            href={`/search?q=${encodeURIComponent(tag.tag)}`}
            className='flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50'
          >
            <span className='text-sm font-medium'>{tag.tag}</span>
            <span className='text-xs text-muted-foreground'>
              {t("posts", { count: formatCount(tag.count) })}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href='/search'
        className='block rounded-b-2xl px-4 py-3 text-sm text-primary transition-colors hover:bg-muted/50'
      >
        {t("showMore")}
      </Link>
    </div>
  )
}
