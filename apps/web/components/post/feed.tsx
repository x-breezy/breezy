"use client"

import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useFeed } from "./use-feed"
import Post from "./post"
import { PostContent } from "./post-content"
import { ProfileAvatar } from "@/components/profile"
import { usePostStore } from "@/stores/post-store"
import { Skeleton } from "@/components/ui/skeleton"
import { listFeedPosts } from "@/lib/actions/feed"
import { getPostsContext } from "@/lib/actions/post-detail"
import { IconArrowUp } from "@tabler/icons-react"
import { Button } from "../ui/button"

function ReplyBlock({
  post,
  parent,
  authorNameFn,
  handleLike,
}: {
  post: import("./use-feed").FeedPost
  parent: import("@/lib/actions/post-detail").PostData
  authorNameFn: (post: import("./use-feed").FeedPost) => string
  handleLike: (postId: string, liked: boolean) => Promise<number | void>
}) {
  const parentName =
    [parent.author?.firstName, parent.author?.lastName].filter(Boolean).join(" ") ||
    parent.author?.username ||
    parent.authorId

  return (
    <div>
      <div className='flex gap-2.5 px-4 pt-2 pb-1'>
        <div className='flex shrink-0 flex-col items-center'>
          <ProfileAvatar
            src={parent.author?.avatarId ?? undefined}
            alt={parentName}
            size='2xs'
          />
          <div className='my-1.5 w-px flex-1 bg-border' />
        </div>
        <div className='min-w-0 flex-1 pb-3'>
          <div className='flex items-center gap-1.5'>
            <span className='truncate text-sm font-semibold hover:underline'>{parentName}</span>
            <span className='truncate text-xs text-muted-foreground'>
              @{parent.author?.username ?? parent.authorId}
            </span>
          </div>
          <PostContent
            content={
              parent.content.length > 250
                ? parent.content.slice(0, 250) + "…"
                : parent.content
            }
          />
          <div className='mt-1 text-sm text-muted-foreground'>
            Replying to{' '}
            <span className='font-semibold text-primary'>
              @{parent.author?.username ?? parent.authorId}
            </span>
          </div>
        </div>
      </div>
      <Post
        id={post._id}
        name={authorNameFn(post)}
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
        threadLine='solid'
        threadLineTop
      />
    </div>
  )
}

export function Feed({ feedType = "forYou" }: { feedType?: string }) {
  const t = useTranslations("feed")
  const { posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed(feedType)
  const cachePosts = usePostStore((s) => s.cachePosts)
  const cacheLikedIds = usePostStore((s) => s.cacheLikedIds)
  const handleLike = usePostStore((s) => s.toggleLike)
  const queryClient = useQueryClient()

  const sentinelRef = useRef<HTMLLIElement>(null)
  const firstPostIdRef = useRef<string | null>(null)
  const [hasNewPosts, setHasNewPosts] = useState(false)
  const scrollKey = `feed-scroll-${feedType}`

  // Restore scroll before first paint so there's no flash to the top
  useLayoutEffect(() => {
    const y = sessionStorage.getItem(scrollKey)
    if (!y) return
    sessionStorage.removeItem(scrollKey)
    window.scrollTo({ top: parseInt(y, 10), behavior: "instant" })
  }, [scrollKey])

  const { data: latestCheck } = useQuery({
    queryKey: ["feed-check", feedType],
    queryFn: () => listFeedPosts(1, feedType, 1),
    refetchInterval: 60_000,
    enabled: !hasNewPosts,
  })

  useEffect(() => {
    firstPostIdRef.current = null
    setHasNewPosts(false)
  }, [feedType])

  useEffect(() => {
    const latestId = latestCheck?.posts[0]?._id
    if (!latestId) return
    if (!firstPostIdRef.current) {
      firstPostIdRef.current = latestId
      return
    }
    if (latestId !== firstPostIdRef.current) setHasNewPosts(true)
  }, [latestCheck])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["feed", feedType] })
    firstPostIdRef.current = null
    setHasNewPosts(false)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

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
        {feedType === "following" ? t("emptyFollowing") : t("emptyDefault")}
      </p>
    )
  }

  const parentIds = useMemo(() => {
    const ids = posts.map((p) => p.parentId).filter(Boolean) as string[]
    return [...new Set(ids)]
  }, [posts])

  const { data: parentContexts } = useQuery({
    queryKey: ["feed-parent-context", feedType, parentIds.slice().sort()],
    queryFn: () => getPostsContext(parentIds),
    enabled: parentIds.length > 0,
  })

  const parentMap = useMemo(() => {
    const map = new Map<string, import("@/lib/actions/post-detail").PostData>()
    if (parentContexts) {
      for (const ctx of parentContexts) {
        map.set(ctx.post._id, ctx.post)
      }
    }
    return map
  }, [parentContexts])

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
      <div className='sticky top-20 z-10 flex h-0 justify-center'>
        <Button
          onClick={handleRefresh}
          className={`rounded-full shadow-lg ${
            hasNewPosts
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <IconArrowUp size={12} /> New posts
        </Button>
      </div>
      <ul
        className='space-y-1'
        onClick={() => sessionStorage.setItem(scrollKey, String(window.scrollY))}
      >
        {posts.map((post) => {
          if (post.parentId) {
            const parent = parentMap.get(post.parentId)
            if (parent) {
              return <ReplyBlock key={post._id} post={post} parent={parent} authorNameFn={authorName} handleLike={handleLike} />
            }
          }
          return (
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
          )
        })}
        {hasNextPage && (
          <li ref={sentinelRef} className='w-full py-3 text-center text-sm text-muted-foreground'>
            {isFetchingNextPage ? "Loading..." : ""}
          </li>
        )}
      </ul>
    </div>
  )
}
