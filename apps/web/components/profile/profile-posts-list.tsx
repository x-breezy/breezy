"use client"

import { Skeleton } from "@/components/ui/skeleton"
import Post from "@/components/post/post"
import { useTranslations } from "next-intl"
import type { ProfilePost } from "./use-profile-posts"
import type { Profile } from "@/types/profile"

interface ProfilePostsListProps {
  posts: ProfilePost[]
  isLoading: boolean
  hasNextPage: boolean
  onLoadMore: () => void
  authorName: string
  profile: Profile
  onLike: (postId: string, liked: boolean) => Promise<number | void>
}

export function ProfilePostsList({
  posts,
  isLoading,
  hasNextPage,
  onLoadMore,
  authorName,
  profile,
  onLike,
}: ProfilePostsListProps) {
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

  if (posts.length === 0) {
    return <p className='py-8 text-center text-sm text-muted-foreground'>{t("noPosts")}</p>
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post._id} className='border-b border-border last:border-b-0'>
          <Post
            id={post._id}
            name={authorName}
            username={profile.username}
            authorId={post.authorId}
            authorRole={profile.role}
            avatarUrl={profile.avatarId ?? undefined}
            content={post.content}
            media={post.media}
            createdAt={post.createdAt}
            initialLikes={post.likesCount}
            initialComments={post.commentsCount}
            initialLiked={post.liked}
            onLike={onLike}
            href={`/post/${profile.username}/${post._id}`}
          />
        </div>
      ))}
      {hasNextPage && (
        <button
          onClick={onLoadMore}
          className='w-full py-3 text-sm text-muted-foreground transition-colors hover:text-foreground'
        >
          Load more
        </button>
      )}
    </div>
  )
}
