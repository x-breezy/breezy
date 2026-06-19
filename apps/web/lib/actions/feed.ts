"use server"

import { getLikedPostIds, type SearchPost } from "@/lib/actions/posts"
import { fetchProfilesByIds, type SearchProfile } from "@/lib/actions/profiles"
import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

const LIMIT = 20

export interface FeedPage {
  posts: SearchPost[]
  likedIds: string[]
  authors: Record<string, SearchProfile>
  total: number
  page: number
  limit: number
}

export async function listFeedPosts(page = 1, type = "forYou", limit?: number): Promise<FeedPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit ?? LIMIT), type })
  const res = await authenticatedFetch(`/api/posts/feed?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status}`)
  const json = await res.json()
  const result = json.data as { data: SearchPost[]; total: number; page: number; limit: number }

  const postIds = result.data.map((p) => p._id)
  const authorIds = [...new Set(result.data.map((p) => p.authorId))]

  const [likedIds, profiles] = await Promise.all([
    getLikedPostIds(postIds),
    fetchProfilesByIds(authorIds),
  ])

  const authors: Record<string, SearchProfile> = {}
  for (const p of profiles) authors[p.profileId] = p

  return {
    posts: result.data,
    likedIds,
    authors,
    total: result.total,
    page: result.page,
    limit: LIMIT,
  }
}
