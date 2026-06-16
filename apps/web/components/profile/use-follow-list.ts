"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { listFollowers, listFollowing } from "@/app/(app)/profile/follow-list-action"
import type { SearchProfile } from "@/lib/api/profiles"

const LIMIT = 30

export type FollowType = "followers" | "following"

export function useFollowList(profileId: string, type: FollowType, enabled: boolean) {
  const fetcher = type === "followers" ? listFollowers : listFollowing

  const query = useInfiniteQuery({
    queryKey: ["follow-list", type, profileId],
    queryFn: ({ pageParam = 1 }) => fetcher(profileId, pageParam as number, LIMIT),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = (lastPage.page - 1) * lastPage.limit + lastPage.profiles.length
      return loaded < lastPage.total ? lastPage.page + 1 : undefined
    },
    enabled: enabled && !!profileId,
  })

  const profiles = useMemo<SearchProfile[]>(
    () => query.data?.pages.flatMap((p) => p.profiles) ?? [],
    [query.data]
  )

  const total = query.data?.pages[0]?.total ?? 0

  return {
    profiles,
    total,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isLoading: query.isLoading,
    error: query.error,
  }
}
