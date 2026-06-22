"use server"

import { getLikedPostIds, type SearchPost } from "@/lib/actions/posts"
import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

const LIMIT = 20

export interface PostsPage {
  posts: SearchPost[]
  likedIds: string[]
  total: number
  page: number
  limit: number
}

export async function listProfilePosts(
  authorId: string,
  page = 1,
  type: string = "posts"
): Promise<PostsPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
  if (type !== "posts") params.set("type", type)
  const res = await authenticatedFetch(`/api/posts/users/${authorId}?${params}`)
  if (!res.ok) throw new Error(`Failed to fetch user posts: ${res.status}`)
  const json = await res.json()
  const result = json.data as { data: SearchPost[]; total: number; page: number; limit: number }
  const postIds = result.data.map((p) => p._id)
  const likedIds = await getLikedPostIds(postIds)
  return { posts: result.data, likedIds, total: result.total, page: result.page, limit: LIMIT }
}
