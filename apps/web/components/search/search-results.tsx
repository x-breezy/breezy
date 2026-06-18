"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { IconLoader2 } from "@tabler/icons-react"
import type { SearchProfile } from "@/lib/actions/profiles"
import { parseTab } from "./types"
import { PersonCard } from "./person-card"
import { MediaGrid } from "./media-grid"
import { useSearchStore, type PostsCache, type PeopleCache, type MediaCache } from "@/stores/search-store"
import { useUserStore } from "@/stores/user-store"
import Post from "../post/post"
import { UserRole } from "@/lib/auth/role"

interface SearchResultsProps {
  q: string
}

export function SearchResults({ q }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const tab = parseTab(searchParams.get("tab"))
  const t = useTranslations("search")

  const following = useUserStore((s) => s.following)
  const search = useSearchStore((s) => s.search)
  const postsCache = useSearchStore((s) => s.postsCache)
  const peopleCache = useSearchStore((s) => s.peopleCache)
  const mediaCache = useSearchStore((s) => s.mediaCache)
  const profileMap = useSearchStore((s) => s.profileMap)
  const loading = useSearchStore((s) => s.loading)
  const error = useSearchStore((s) => s.error)
  const handleLike = useSearchStore((s) => s.handleLike)
  const handleFollow = useSearchStore((s) => s.handleFollow)

  useEffect(() => {
    search(q, tab)
  }, [q, tab, search])

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

        {!loading &&
          !error &&
          tab === "posts" &&
          renderPosts(postsCache, profileMap, handleLike, t)}
        {!loading &&
          !error &&
          tab === "people" &&
          renderPeople(peopleCache, handleFollow, following, t)}
        {!loading && !error && tab === "media" && renderMedia(mediaCache, t)}
      </ul>
    </div>
  )
}

function renderPosts(
  cache: PostsCache | null,
  profileMap: Map<string, SearchProfile>,
  onLike: (postId: string, liked: boolean) => Promise<number | void>,
  t: any
) {
  if (!cache || cache.posts.length === 0) {
    return <EmptyState label={t("noPosts")} />
  }
  return cache.posts.map((post) => {
    const profile = profileMap.get(post.authorId)
    const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || null
    const name = displayName ?? profile?.username ?? t("fallbackUser")
    return (
      <li key={post._id} className='w-full'>
        <Post
          id={post._id}
          avatarUrl={profile?.avatarUrl || undefined}
          name={name}
          username={profile?.username ?? ""}
          authorId={post.authorId}
          authorRole={profile?.role}
          content={post.content}
          media={post.media}
          createdAt={post.createdAt}
          initialLikes={post.likesCount}
          initialComments={post.commentsCount}
          initialLiked={cache.likedIds.has(post._id)}
          onLike={onLike}
          href={`/post/${profile?.username ?? post.authorId}/${post._id}`}
        />
      </li>
    )
  })
}

function renderPeople(
  cache: PeopleCache | null,
  onFollow: (id: string, follow: boolean) => Promise<void>,
  following: Record<string, boolean>,
  t: any
) {
  if (!cache || cache.people.length === 0) {
    return <EmptyState label={t("noPeople")} />
  }
  return cache.people.map((item) => (
    <li key={item.id} className='w-full'>
      <Link href={`/profile/${item.username}`}>
        <PersonCard
          id={item.id}
          displayName={item.displayName}
          username={item.username}
          avatarUrl={item.avatarUrl}
          role={item.role as UserRole | undefined}
          bio={item.bio}
          followersCount={item.followersCount}
          initialFollowing={following[item.id] ?? false}
          onFollow={onFollow}
        />
      </Link>
    </li>
  ))
}

function renderMedia(cache: MediaCache | null, t: any) {
  if (!cache || cache.media.length === 0) {
    return <EmptyState label={t("noMedia")} />
  }
  return <MediaGrid items={cache.media} />
}

function EmptyState({ label }: { label: string }) {
  return <li className='px-4 py-8 text-center text-sm text-muted-foreground'>{label}</li>
}
