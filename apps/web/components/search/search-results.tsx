"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { IconLoader2 } from "@tabler/icons-react"
import HomePost from "@/components/home/home-post"
import type { SearchProfile } from "@/lib/api/profiles"
import { parseTab } from "./types"
import { timeAgo } from "@/lib/utils"
import { PersonCard } from "./person-card"
import { MediaGrid } from "./media-grid"
import {
  useSearchResults,
  type PostsCache,
  type PeopleCache,
  type MediaCache,
} from "./use-search-results"
import { startTransition } from "react"
import { followUserAction } from "@/app/(app)/profile/follow-action"
import { useUserStore } from "@/stores/user-store"

interface SearchResultsProps {
  q: string
}

export function SearchResults({ q }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const tab = parseTab(searchParams.get("tab"))

  const following = useUserStore((s) => s.following)

  const {
    postsCache,
    peopleCache,
    mediaCache,
    profileMap,
    loading,
    error,
    handleLike,
    handleFollow,
  } = useSearchResults(q, tab)

  return (
    <div>
      <ul className='container-center w-full py-2 [&>li:last-child_.person-card]:border-b-0 [&>li:last-child_article]:border-b-0'>
        {loading && (
          <li className='flex justify-center py-12'>
            <IconLoader2 size={24} className='animate-spin text-muted-foreground' />
          </li>
        )}

        {error && !loading && (
          <li className='px-4 py-8 text-center text-sm text-destructive'>{error}</li>
        )}

        {!loading && !error && tab === "posts" && renderPosts(postsCache, profileMap, handleLike)}
        {!loading &&
          !error &&
          tab === "people" &&
          renderPeople(peopleCache, handleFollow, following)}
        {!loading && !error && tab === "media" && renderMedia(mediaCache)}
      </ul>
    </div>
  )
}

function renderPosts(
  cache: PostsCache | null,
  profileMap: Map<string, SearchProfile>,
  onLike: (postId: string, liked: boolean) => Promise<number | void>
) {
  if (!cache || cache.posts.length === 0) {
    return <EmptyState label='Aucun post trouvé' />
  }
  return cache.posts.map((post) => {
    const profile = profileMap.get(post.authorId)
    const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || null
    const name = displayName ?? profile?.username ?? "Utilisateur"
    return (
      <li key={post._id} className='w-full'>
        <HomePost
          id={post._id}
          name={name}
          username={profile?.username ?? ""}
          content={post.content}
          createdAt={timeAgo(post.createdAt)}
          initialLikes={post.likesCount}
          initialComments={post.commentsCount}
          initialLiked={cache.likedIds.has(post._id)}
          onLike={onLike}
        />
      </li>
    )
  })
}

function renderPeople(
  cache: PeopleCache | null,
  onFollow: (id: string, follow: boolean) => Promise<void>,
  following: Record<string, boolean>
) {
  if (!cache || cache.people.length === 0) {
    return <EmptyState label='Aucun utilisateur trouvé' />
  }
  return cache.people.map((item) => (
    <li key={item.id} className='w-full'>
      <Link href={`/profile/${item.username}`}>
        <PersonCard
          id={item.id}
          displayName={item.displayName}
          username={item.username}
          avatarUrl={item.avatarUrl}
          bio={item.bio}
          followersCount={item.followersCount}
          initialFollowing={following[item.id] ?? false}
          onFollow={onFollow}
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
