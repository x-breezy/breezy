"use client"

import { useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { MediaGrid } from "@/components/search/media-grid"
import { collectMedia } from "@/components/search/search-utils"
import type { ProfilePost } from "./use-profile-posts"

interface ProfileMediaListProps {
  posts: ProfilePost[]
  isLoading: boolean
}

export function ProfileMediaList({ posts, isLoading }: ProfileMediaListProps) {
  const mediaItems = useMemo(() => collectMedia(posts), [posts])

  if (isLoading) {
    return (
      <div className='space-y-1'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='flex gap-2.5 p-3.5'>
            <Skeleton className='size-11 shrink-0 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-3 w-32' />
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-4/5' />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (mediaItems.length === 0) {
    return <p className='py-8 text-center text-sm text-muted-foreground'>No media yet.</p>
  }

  return (
    <ul>
      <MediaGrid items={mediaItems} />
    </ul>
  )
}
