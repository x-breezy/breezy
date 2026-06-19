"use client"

import { useRef, useEffect } from "react"
import { useFeed } from "./use-feed"
import Post from "./post"
import { usePostStore } from "@/stores/post-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@tabler/icons-react"

export function Feed() {
  const {
    posts,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useFeed()
  const cachePosts = usePostStore((s) => s.cachePosts)
  const cacheLikedIds = usePostStore((s) => s.cacheLikedIds)
  const handleLike = usePostStore((s) => s.toggleLike)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (posts.length > 0) {
      cachePosts(posts)
      cacheLikedIds(posts.filter((p) => p.liked).map((p) => p._id))
    }
  }, [posts, cachePosts, cacheLikedIds])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

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
    <ul className='space-y-1'>
      <li>
        <div className='flex justify-end px-3.5 py-1'>
          <Button
            variant='ghost'
            size='icon-sm'
            onClick={() => refetch()}
            disabled={isRefetching}
            aria-label='Refresh feed'
          >
            <IconRefresh className={`size-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
        {posts.map((post) => (
          <Post
            key={post._id}
            id={post._id}
            name={authorName(post)}
            username={post.author?.username ?? post.authorId}
            authorId={post.authorId}
            avatarUrl={post.author?.avatarUrl ?? undefined}
            content={post.content}
            media={post.media}
            createdAt={post.createdAt}
            initialLikes={post.likesCount}
            initialComments={post.commentsCount}
            initialLiked={post.liked}
            onLike={handleLike}
            href={`/post/${post.author?.username ?? post.authorId}/${post._id}`}
          />
        ))}
        {hasNextPage && (
          <div ref={sentinelRef} className='w-full py-3 text-center text-sm text-muted-foreground'>
            {isFetchingNextPage ? "Loading..." : ""}
          </div>
        )}
      </li>
    </ul>
  )
}
