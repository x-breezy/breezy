"use server"

import { cookies } from "next/headers"
import { getLikedPostIds, type SearchPost } from "@/lib/actions/posts"

const API_URL = process.env.API_URL ?? "http://localhost"
const LIMIT = 20

export interface PostsPage {
  posts: SearchPost[]
  likedIds: string[]
  total: number
  page: number
  limit: number
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function listProfilePosts(
  authorId: string,
  page = 1,
  type: string = "posts"
): Promise<PostsPage> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
  if (type !== "posts") params.set("type", type)
  const res = await fetch(`${API_URL}/api/posts/users/${authorId}?${params}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch user posts: ${res.status}`)
  const json = await res.json()
  const result = json.data as { data: SearchPost[]; total: number; page: number; limit: number }
  const postIds = result.data.map((p) => p._id)
  const likedIds = await getLikedPostIds(postIds)
  return { posts: result.data, likedIds, total: result.total, page: result.page, limit: LIMIT }
}
