"use client"

import { useRef, useEffect, useLayoutEffect, useState, useMemo } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import { useFeed } from "./use-feed"
import Post from "./post"
import { CommentTree } from "./comment-tree"
import { usePostStore } from "@/stores/post-store"
import { Skeleton } from "@/components/ui/skeleton"
import { listFeedPosts } from "@/lib/actions/feed"
import { IconArrowUp } from "@tabler/icons-react"
import { Button } from "../ui/button"
import type { CommentNode } from "./comment-tree"
import type { FeedPost } from "./use-feed"
import type { ProfileRef } from "@/lib/actions/post-detail"
import type { SearchProfile } from "@/lib/actions/profiles"

function toProfileRef(profile?: SearchProfile): ProfileRef | null {
  if (!profile) return null
  return {
    username: profile.username ?? "",
    avatarId: profile.avatarUrl,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: profile.role,
  }
}

export function Feed({ feedType = "forYou" }: { feedType?: string }) {
  const t = useTranslations("feed")
  const { posts, parentPosts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useFeed(feedType)
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

  const feedItems = useMemo(() => {
    const items: Array<
      { type: "post"; post: FeedPost } | { type: "reply-group"; commentNode: CommentNode }
    > = []
    const renderedParents = new Set<string>()
    const replyGroups = new Map<string, FeedPost[]>()

    for (const post of posts) {
      if (post.parentId) {
        const group = replyGroups.get(post.parentId) ?? []
        group.push(post)
        replyGroups.set(post.parentId, group)
      }
    }

    const coveredParents = new Set<string>()
    for (const post of posts) {
      if (post.parentId && parentPosts[post.parentId]) {
        coveredParents.add(post.parentId)
      }
    }

    for (const post of posts) {
      if (!post.parentId && !coveredParents.has(post._id)) {
        items.push({ type: "post", post })
      } else if (post.parentId && !renderedParents.has(post.parentId)) {
        renderedParents.add(post.parentId)
        const parent = parentPosts[post.parentId]
        if (!parent) continue
        const group = replyGroups.get(post.parentId) ?? []
        const commentNode: CommentNode = {
          _id: parent._id,
          content: parent.content,
          authorId: parent.authorId,
          parentId: parent.parentId,
          tags: parent.tags,
          mentions: parent.mentions,
          media: parent.media,
          likesCount: parent.likesCount,
          commentsCount: parent.commentsCount,
          createdAt: parent.createdAt,
          author: toProfileRef(parent.author),
          likedByMe: parent.liked,
          replies: group.map((r) => ({
            _id: r._id,
            content: r.content,
            authorId: r.authorId,
            parentId: r.parentId,
            tags: r.tags,
            mentions: r.mentions,
            media: r.media,
            likesCount: r.likesCount,
            commentsCount: r.commentsCount,
            createdAt: r.createdAt,
            author: toProfileRef(r.author),
            likedByMe: r.liked,
            replies: [],
          })),
        }
        items.push({ type: "reply-group", commentNode })
      }
    }
    return items
  }, [posts, parentPosts])

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

  const authorName = (post: FeedPost) => {
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
      <ul onClick={() => sessionStorage.setItem(scrollKey, String(window.scrollY))}>
        {feedItems.map((item) => {
          if (item.type === "reply-group") {
            return (
              <li key={`ct-${item.commentNode._id}`} className='border-b border-border'>
                <CommentTree comments={[item.commentNode]} />
              </li>
            )
          }
          const post = item.post
          return (
            <li key={post._id} className='border-b border-border'>
              <Post
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
            </li>
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
