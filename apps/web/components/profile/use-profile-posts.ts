"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { listProfilePosts } from "@/app/(app)/profile/profile-posts-action"
import type { SearchPost } from "@/lib/actions/posts"

export interface ProfilePost extends SearchPost {
  liked: boolean
}

export function useProfilePosts(authorId: string, type: string = "posts", enabled = true) {
  const query = useInfiniteQuery({
    queryKey: ["profile-posts", authorId, type],
    queryFn: ({ pageParam = 1 }) => listProfilePosts(authorId, pageParam as number, type),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = (lastPage.page - 1) * lastPage.limit + lastPage.posts.length
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    enabled: !!authorId && enabled,
  })

  const posts = useMemo<ProfilePost[]>(
    () =>
      query.data?.pages.flatMap((p) =>
        p.posts.map((post) => ({ ...post, liked: p.likedIds.includes(post._id) }))
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
