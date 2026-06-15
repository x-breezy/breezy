"use client"

import { useCallback } from "react"
import { useFeed } from "./use-feed"
import Post from "./post"
import { toggleLike } from "@/lib/actions/posts"
import { timeAgo } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export function Feed() {
  const { posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed()

  const handleLike = useCallback(async (postId: string, liked: boolean) => {
    const res = await toggleLike(postId, liked)
    return res.likesCount
  }, [])

  if (isLoading) {
    return (
      <div className='space-y-1'>
        {Array.from({ length: 5 }).map((_, i) => (
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
    return (
      <p className='py-8 text-center text-sm text-muted-foreground'>
        No posts yet. Follow some people to see their posts here.
      </p>
    )
  }

  const authorName = (post: (typeof posts)[number]) => {
    const { author } = post
    if (!author) return post.authorId
    return (
      [author.firstName, author.lastName].filter(Boolean).join(" ") ||
      author.username ||
      post.authorId
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <Post
          key={post._id}
          id={post._id}
          name={authorName(post)}
          username={post.author?.username ?? post.authorId}
          avatarUrl={post.author?.avatarUrl ?? undefined}
          content={post.content}
          media={post.media}
          createdAt={timeAgo(post.createdAt)}
          initialLikes={post.likesCount}
          initialComments={post.commentsCount}
          initialLiked={post.liked}
          onLike={handleLike}
        />
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className='w-full py-3 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50'
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  )
}
