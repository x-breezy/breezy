"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconLoader2 } from "@tabler/icons-react"
import HomePost from "@/components/home/home-post"
import {
  searchPosts,
  searchUsers,
  searchProfiles,
  type SearchPost,
  type SearchUser,
  type SearchProfile,
} from "@/lib/api/search"
import { parseTab } from "./types"
import { timeAgo } from "@/lib/utils"
import { PersonCard } from "./person-card"
import { MediaGrid } from "./media-grid"
import { mergeByProfileId, collectMedia } from "./search-utils"

interface SearchResultsProps {
  q: string
}

interface Results {
  posts: SearchPost[]
  users: SearchUser[]
  profiles: SearchProfile[]
  fetchedQ: string
}

const EMPTY_RESULTS: Results = { posts: [], users: [], profiles: [], fetchedQ: "" }

export function SearchResults({ q }: SearchResultsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = parseTab(searchParams.get("tab"))
  const [results, setResults] = useState<Results>(EMPTY_RESULTS)

  const loading = q !== results.fetchedQ

  useEffect(() => {
    if (!q) return
    let cancelled = false
    Promise.all([searchPosts(q), searchUsers(q), searchProfiles(q)])
      .then(([postsRes, usersRes, profilesRes]) => {
        if (cancelled) return
        setResults({
          posts: postsRes.data,
          users: usersRes.users,
          profiles: profilesRes.profiles,
          fetchedQ: q,
        })
      })
      .catch(() => {
        if (!cancelled) setResults({ posts: [], users: [], profiles: [], fetchedQ: q })
      })
    return () => {
      cancelled = true
    }
  }, [q])

  const { posts, users, profiles } = results
  const mergedPeople = useMemo(() => mergeByProfileId(users, profiles), [users, profiles])
  const profileMap = useMemo(() => new Map(mergedPeople.map((p) => [p.id, p])), [mergedPeople])
  const mediaList = useMemo(() => collectMedia(posts), [posts])

  return (
    <div>
      <ul className='mx-auto w-fit py-2'>
        {loading && (
          <li className='flex justify-center py-12'>
            <IconLoader2 size={24} className='animate-spin text-muted-foreground' />
          </li>
        )}

        {!loading &&
          tab === "posts" &&
          (posts.length === 0 ? (
            <EmptyState label='Aucun post trouvé' />
          ) : (
            posts.map((post) => {
              const profile = profileMap.get(post.authorId)
              return (
                <li
                  key={post._id}
                  onClick={() => router.push(`/posts/${post._id}`)}
                  className='w-full cursor-pointer'
                >
                  <HomePost
                    id={post._id}
                    name={profile?.displayName ?? profile?.username ?? "Utilisateur"}
                    username={profile?.username ?? ""}
                    content={post.content}
                    createdAt={timeAgo(post.createdAt)}
                    initialLikes={post.likesCount}
                    initialComments={post.commentsCount}
                  />
                </li>
              )
            })
          ))}

        {!loading &&
          tab === "people" &&
          (mergedPeople.length === 0 ? (
            <EmptyState label='Aucun utilisateur trouvé' />
          ) : (
            mergedPeople.map((item) => (
              <PersonCard
                key={item.id}
                id={item.id}
                displayName={item.displayName}
                username={item.username}
                avatarUrl={item.avatarUrl}
                onClick={() => router.push(`/profile/${item.id}`)}
              />
            ))
          ))}

        {!loading &&
          tab === "media" &&
          (mediaList.length === 0 ? (
            <EmptyState label='Aucun média trouvé' />
          ) : (
            <MediaGrid items={mediaList} />
          ))}
      </ul>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <li className='px-4 py-8 text-center text-sm text-muted-foreground'>{label}</li>
}
