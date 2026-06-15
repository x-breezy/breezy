"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { searchPosts, getLikedPostIds, toggleLike } from "@/lib/actions/posts"
import { searchProfiles, fetchProfilesByIds, followProfile, unfollowProfile } from "@/lib/actions/profiles"
import { collectMedia, profilesToPeople, type MergedPerson } from "./search-utils"
import type { SearchPost, PaginatedResult } from "@/lib/actions/posts"
import type { SearchProfile } from "@/lib/actions/profiles"
import type { Tab } from "./types"

interface TabCache {
    fetchedQ: string
}

export interface PostsCache extends TabCache {
    posts: SearchPost[]
    profiles: SearchProfile[]
    likedIds: Set<string>
    total: number
}

export interface PeopleCache extends TabCache {
    people: MergedPerson[]
    total: number
}

export interface MediaCache extends TabCache {
    media: { id: string; type: "image" | "video" }[]
    total: number
}

export interface UseSearchResultsReturn {
    postsCache: PostsCache | null
    peopleCache: PeopleCache | null
    mediaCache: MediaCache | null
    profileMap: Map<string, SearchProfile>
    loading: boolean
    error: string | null
    handleLike: (postId: string, liked: boolean) => Promise<number | void>
    handleFollow: (id: string, follow: boolean) => Promise<void>
}

export function useSearchResults(q: string, tab: Tab): UseSearchResultsReturn {
    const [postsCache, setPostsCache] = useState<PostsCache | null>(null)
    const [peopleCache, setPeopleCache] = useState<PeopleCache | null>(null)
    const [mediaCache, setMediaCache] = useState<MediaCache | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPosts = useCallback(
        async (query: string, signal: AbortSignal) => {
            if (postsCache && postsCache.fetchedQ === query) return
            setLoading(true)
            setError(null)
            try {
                const postsRes: PaginatedResult<SearchPost> = await searchPosts(query)
                if (signal.aborted) return
                const authorIds = [...new Set(postsRes.data.map((p) => p.authorId))]
                const postIds = postsRes.data.map((p) => p._id)
                const [profiles, likedIds] = await Promise.all([
                    fetchProfilesByIds(authorIds),
                    getLikedPostIds(postIds).catch(() => [] as string[]),
                ])
                if (signal.aborted) return
                setPostsCache({
                    posts: postsRes.data,
                    profiles,
                    likedIds: new Set(likedIds),
                    total: postsRes.total,
                    fetchedQ: query,
                })
            } catch (err: unknown) {
                if (signal.aborted) return
                const msg = err instanceof Error ? err.message : "Erreur lors de la recherche"
                setError(msg)
                setPostsCache({ posts: [], profiles: [], likedIds: new Set(), total: 0, fetchedQ: query })
            } finally {
                if (!signal.aborted) setLoading(false)
            }
        },
        [postsCache]
    )

    const fetchPeople = useCallback(
        async (query: string, signal: AbortSignal) => {
            if (peopleCache && peopleCache.fetchedQ === query) return
            setLoading(true)
            setError(null)
            try {
                const profilesRes = await searchProfiles(query)
                if (signal.aborted) return
                const people = profilesToPeople(profilesRes.profiles)
                setPeopleCache({ people, total: profilesRes.total, fetchedQ: query })
            } catch (err: unknown) {
                if (signal.aborted) return
                const msg = err instanceof Error ? err.message : "Erreur lors de la recherche"
                setError(msg)
                setPeopleCache({ people: [], total: 0, fetchedQ: query })
            } finally {
                if (!signal.aborted) setLoading(false)
            }
        },
        [peopleCache]
    )

    const fetchMedia = useCallback(
        async (query: string, signal: AbortSignal) => {
            if (mediaCache && mediaCache.fetchedQ === query) return
            if (postsCache && postsCache.fetchedQ === query) {
                const media = collectMedia(postsCache.posts)
                setMediaCache({ media, total: media.length, fetchedQ: query })
                return
            }
            setLoading(true)
            setError(null)
            try {
                const postsRes = await searchPosts(query)
                if (signal.aborted) return
                const media = collectMedia(postsRes.data)
                setMediaCache({ media, total: media.length, fetchedQ: query })
            } catch (err: unknown) {
                if (signal.aborted) return
                const msg = err instanceof Error ? err.message : "Erreur lors de la recherche"
                setError(msg)
                setMediaCache({ media: [], total: 0, fetchedQ: query })
            } finally {
                if (!signal.aborted) setLoading(false)
            }
        },
        [mediaCache, postsCache]
    )

    useEffect(() => {
        if (!q) return
        const controller = new AbortController()
        if (tab === "posts") fetchPosts(q, controller.signal)
        else if (tab === "people") fetchPeople(q, controller.signal)
        else if (tab === "media") fetchMedia(q, controller.signal)
        return () => controller.abort()
    }, [q, tab, fetchPosts, fetchPeople, fetchMedia])

    const profileMap = useMemo(() => {
        if (!postsCache) return new Map<string, SearchProfile>()
        return new Map(postsCache.profiles.map((p) => [p.profileId, p]))
    }, [postsCache])

    const handleLike = useCallback(async (postId: string, liked: boolean): Promise<number | void> => {
        try {
            const { likesCount } = await toggleLike(postId, liked)
            setPostsCache((prev) => {
                if (!prev) return prev
                const newLikedIds = new Set(prev.likedIds)
                if (liked) newLikedIds.add(postId)
                else newLikedIds.delete(postId)
                return {
                    ...prev,
                    likedIds: newLikedIds,
                    posts: prev.posts.map((p) => (p._id === postId ? { ...p, likesCount } : p)),
                }
            })
            return likesCount
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status
            if (status === 409 || status === 404) return
            throw err
        }
    }, [])

    const handleFollow = useCallback(async (id: string, follow: boolean): Promise<void> => {
        if (follow) await followProfile(id)
        else await unfollowProfile(id)
    }, [])

    return {
        postsCache,
        peopleCache,
        mediaCache,
        profileMap,
        loading,
        error,
        handleLike,
        handleFollow,
    }
}
