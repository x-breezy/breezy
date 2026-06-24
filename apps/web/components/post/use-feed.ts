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

export function useFeed(type = "forYou") {
  const query = useInfiniteQuery({
    queryKey: ["feed", type],
    queryFn: ({ pageParam = 1 }) => listFeedPosts(pageParam as number, type),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.posts.length < lastPage.limit) return undefined
      const loaded = (lastPage.page - 1) * lastPage.limit + lastPage.posts.length
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    refetchOnMount: false,
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

  const parentPosts = useMemo<Record<string, FeedPost>>(() => {
    const result: Record<string, FeedPost> = {}
    for (const page of query.data?.pages ?? []) {
      for (const [pid, pp] of Object.entries(page.parentPosts)) {
        if (result[pid]) continue
        result[pid] = {
          ...pp,
          liked: page.likedIds.includes(pp._id),
          author: page.authors[pp.authorId],
        }
      }
    }
    return result
  }, [query.data])

  const likes = useMemo(() => {
    const set = new Set<string>()
    for (const page of query.data?.pages ?? []) {
      for (const id of page.likedIds) set.add(id)
    }
    return set
  }, [query.data])

  const authors = useMemo(() => {
    const map: Record<string, SearchProfile> = {}
    for (const page of query.data?.pages ?? []) {
      Object.assign(map, page.authors)
    }
    return map
  }, [query.data])

  return {
    posts,
    parentPosts,
    likes,
    authors,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  }
}
