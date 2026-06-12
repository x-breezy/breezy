"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { IconLoader2 } from "@tabler/icons-react"
import HomePost from "@/components/home/home-post"
import {
  searchPosts,
  searchProfiles,
  fetchProfilesByIds,
  type SearchPost,
  type SearchProfile,
} from "@/lib/api/search"
import { parseTab } from "./types"
import { timeAgo } from "@/lib/utils"
import { PersonCard } from "./person-card"
import { MediaGrid } from "./media-grid"
import { profilesToPeople, collectMedia, type MergedPerson } from "./search-utils"

interface SearchResultsProps {
  q: string
}

interface TabCache {
  fetchedQ: string
}

interface PostsCache extends TabCache {
  posts: SearchPost[]
  profiles: SearchProfile[]
  total: number
}

interface PeopleCache extends TabCache {
  people: MergedPerson[]
  total: number
}

interface MediaCache extends TabCache {
  media: { id: string; type: "image" | "video" }[]
  total: number
}

export function SearchResults({ q }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const tab = parseTab(searchParams.get("tab"))

  const [postsCache, setPostsCache] = useState<PostsCache | null>(null)
  const [peopleCache, setPeopleCache] = useState<PeopleCache | null>(null)
  const [mediaCache, setMediaCache] = useState<MediaCache | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(
    async (query: string) => {
      if (postsCache && postsCache.fetchedQ === query) return
      setLoading(true)
      setError(null)
      try {
        const postsRes = await searchPosts(query)
        const authorIds = [...new Set(postsRes.data.map((p) => p.authorId))]
        const profiles = await fetchProfilesByIds(authorIds)
        setPostsCache({ posts: postsRes.data, profiles, total: postsRes.total, fetchedQ: query })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur lors de la recherche"
        setError(msg)
        setPostsCache({ posts: [], profiles: [], total: 0, fetchedQ: query })
      } finally {
        setLoading(false)
      }
    },
    [postsCache]
  )

  const fetchPeople = useCallback(
    async (query: string) => {
      if (peopleCache && peopleCache.fetchedQ === query) return
      setLoading(true)
      setError(null)
      try {
        const profilesRes = await searchProfiles(query)
        const people = profilesToPeople(profilesRes.profiles)
        setPeopleCache({ people, total: profilesRes.total, fetchedQ: query })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur lors de la recherche"
        setError(msg)
        setPeopleCache({ people: [], total: 0, fetchedQ: query })
      } finally {
        setLoading(false)
      }
    },
    [peopleCache]
  )

  const fetchMedia = useCallback(
    async (query: string) => {
      if (mediaCache && mediaCache.fetchedQ === query) return
      // Reuse posts cache when the query matches to avoid a redundant request
      if (postsCache && postsCache.fetchedQ === query) {
        const media = collectMedia(postsCache.posts)
        setMediaCache({ media, total: media.length, fetchedQ: query })
        return
      }
      setLoading(true)
      setError(null)
      try {
        const postsRes = await searchPosts(query)
        const media = collectMedia(postsRes.data)
        setMediaCache({ media, total: media.length, fetchedQ: query })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erreur lors de la recherche"
        setError(msg)
        setMediaCache({ media: [], total: 0, fetchedQ: query })
      } finally {
        setLoading(false)
      }
    },
    [mediaCache, postsCache]
  )

  useEffect(() => {
    if (!q) return
    if (tab === "posts") fetchPosts(q)
    else if (tab === "people") fetchPeople(q)
    else if (tab === "media") fetchMedia(q)
  }, [q, tab, fetchPosts, fetchPeople, fetchMedia])

  const profileMap = useMemo(() => {
    if (!postsCache) return new Map<string, SearchProfile>()
    return new Map(postsCache.profiles.map((p) => [p.profileId, p]))
  }, [postsCache])

  return (
    <div className='mt-[30px]'>
      <ul className='mx-auto w-fit py-2'>
        {loading && (
          <li className='flex justify-center py-12'>
            <IconLoader2 size={24} className='animate-spin text-muted-foreground' />
          </li>
        )}

        {error && !loading && (
          <li className='px-4 py-8 text-center text-sm text-destructive'>{error}</li>
        )}

        {!loading && !error && tab === "posts" && renderPosts(postsCache, profileMap)}
        {!loading && !error && tab === "people" && renderPeople(peopleCache)}
        {!loading && !error && tab === "media" && renderMedia(mediaCache)}
      </ul>
    </div>
  )
}

function renderPosts(cache: PostsCache | null, profileMap: Map<string, SearchProfile>) {
  if (!cache || cache.posts.length === 0) {
    return <EmptyState label='Aucun post trouvé' />
  }
  return cache.posts.map((post) => {
    const profile = profileMap.get(post.authorId)
    const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || null
    const name = displayName ?? profile?.username ?? "Utilisateur"
    return (
      <li key={post._id} className='w-full'>
        <Link href={`/posts/${post._id}`} className='block'>
          <HomePost
            id={post._id}
            name={name}
            username={profile?.username ?? ""}
            content={post.content}
            createdAt={timeAgo(post.createdAt)}
            initialLikes={post.likesCount}
            initialComments={post.commentsCount}
          />
        </Link>
      </li>
    )
  })
}

function renderPeople(cache: PeopleCache | null) {
  if (!cache || cache.people.length === 0) {
    return <EmptyState label='Aucun utilisateur trouvé' />
  }
  return cache.people.map((item) => (
    <li key={item.id}>
      <Link href={`/profile/${item.id}`} className='block'>
        <PersonCard
          id={item.id}
          displayName={item.displayName}
          username={item.username}
          avatarUrl={item.avatarUrl}
          onClick={() => {}}
        />
      </Link>
    </li>
  ))
}

function renderMedia(cache: MediaCache | null) {
  if (!cache || cache.media.length === 0) {
    return <EmptyState label='Aucun média trouvé' />
  }
  return <MediaGrid items={cache.media} />
}

function EmptyState({ label }: { label: string }) {
  return <li className='px-4 py-8 text-center text-sm text-muted-foreground'>{label}</li>
}
