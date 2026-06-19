"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { listFeedPosts } from "@/lib/actions/feed"
import type { SearchPost } from "@/lib/actions/posts"
import type { SearchProfile } from "@/lib/actions/profiles"

export interface FeedPost extends SearchPost {
  liked: boolean
  author: SearchProfile | undefined
}

export function useFeed() {
  const query = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 1 }) => listFeedPosts(pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = (lastPage.page - 1) * lastPage.limit + lastPage.posts.length
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
  })

  const posts = useMemo<FeedPost[]>(
    () =>
      query.data?.pages.flatMap((p) =>
        p.posts.map((post) => ({
          ...post,
          liked: p.likedIds.includes(post._id),
          author: p.authors[post.authorId],
        }))
      ) ?? [],
    [query.data]
  )

  return {
    posts,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    error: query.error,
  }
}
