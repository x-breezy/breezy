"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getTrendingTags, type TrendingTag } from "@/lib/api/search"
import { IconTrendingUp } from "@tabler/icons-react"

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function TagList() {
  const [tags, setTags] = useState<TrendingTag[]>([])

  useEffect(() => {
    getTrendingTags(10)
      .then(setTags)
      .catch((err: unknown) => console.error("Failed to fetch trending tags", err))
  }, [])

  if (tags.length === 0) return null

  return (
    <div className='m-auto flex max-w-4xl flex-col gap-4 px-4 py-4'>
      <div className='flex items-center justify-between gap-2'>
        <p className='font-semibold'>Tendances en ce moment</p>
        <IconTrendingUp stroke={2} />
      </div>
      <ul className='flex flex-col gap-0'>
        {tags.map((item, i) => (
          <li key={item.tag} className='rounded-md p-2 transition-colors hover:bg-muted/50'>
            <Link
              href={`/search?q=${encodeURIComponent(item.tag)}`}
              className='group flex items-center gap-4'
            >
              <span className='text-md w-4 shrink-0 font-medium text-muted-foreground'>
                {i + 1}
              </span>
              <div className='flex w-full flex-row items-center justify-between gap-1'>
                <span className='text-sm font-semibold'>{item.tag}</span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {formatCount(item.count)} posts
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
