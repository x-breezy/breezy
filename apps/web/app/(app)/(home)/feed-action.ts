"use server"

import { cookies } from "next/headers"
import { getLikedPostIds, type SearchPost } from "@/lib/actions/posts"
import { fetchProfilesByIds, type SearchProfile } from "@/lib/actions/profiles"

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:80"
const LIMIT = 20

export interface FeedPage {
  posts: SearchPost[]
  likedIds: string[]
  authors: Record<string, SearchProfile>
  total: number
  page: number
  limit: number
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function listFeedPosts(page = 1): Promise<FeedPage> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
  const res = await fetch(`${GATEWAY_URL}/api/posts/feed?${params}`, { headers })
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
