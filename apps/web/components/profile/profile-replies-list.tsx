"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { CommentTree } from "@/components/post/comment-tree"
import type { CommentNode } from "@/components/post/comment-tree"
import { useTranslations } from "next-intl"

interface ProfileRepliesListProps {
  threads: CommentNode[]
  isLoading: boolean
}

export function ProfileRepliesList({ threads, isLoading }: ProfileRepliesListProps) {
  const t = useTranslations("profilePage")

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

  if (threads.length === 0) {
    return <p className='py-8 text-center text-sm text-muted-foreground'>{t("noReplies")}</p>
  }

  return (
    <div>
      {threads.map((thread) => (
        <div key={thread._id} className='border-b border-border last:border-b-0'>
          <CommentTree comments={[thread]} />
        </div>
      ))}
    </div>
  )
}
