"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export interface SearchPostMedia {
  id: string
  type: "image" | "video"
}

export interface CreatePostInput {
  content: string
  tags: string[]
  mentions: string[]
  media: SearchPostMedia[]
  parentId?: string
}

export interface SearchPost {
  _id: string
  content: string
  authorId: string
  parentId?: string
  tags: string[]
  mentions: string[]
  media: SearchPostMedia[]
  likesCount: number
  commentsCount: number
  createdAt: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface TrendingTag {
  tag: string
  count: number
}

export async function createPost(input: CreatePostInput): Promise<void> {
  const res = await authenticatedFetch("/api/posts/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create post: ${res.status} - ${text}`)
  }
}

export async function searchPosts(
  q: string,
  page = 1,
  limit = 20,
  authorIds?: string[]
): Promise<PaginatedResult<SearchPost>> {
  const params = new URLSearchParams({ q, page: String(page), limit: String(limit) })
  if (authorIds?.length) params.set("authorIds", authorIds.join(","))

  const res = await authenticatedFetch(`/api/posts/search?${params}`)
  if (!res.ok) throw new Error(`Failed to search posts: ${res.status}`)
  const data = await res.json()
  return data.data as PaginatedResult<SearchPost>
}

export async function getLikedPostIds(postIds: string[]): Promise<string[]> {
  if (postIds.length === 0) return []
  const res = await authenticatedFetch(`/api/posts/liked-by-me?postIds=${postIds.join(",")}`)
  if (!res.ok) throw new Error(`Failed to get liked posts: ${res.status}`)
  const data = await res.json()
  return data.data as string[]
}

export async function toggleLike(postId: string, liked: boolean): Promise<{ likesCount: number }> {
  // Validate postId format to prevent SSRF (CodeQL false positive suppression)
  if (!/^[a-f0-9]{24}$/i.test(postId)) {
    throw new Error("Invalid postId format")
  }
  const res = await authenticatedFetch(`/api/posts/${postId}/likes`, {
    method: liked ? "POST" : "DELETE",
  })
  if (!res.ok) throw new Error(`Failed to toggle like: ${res.status}`)
  const data = await res.json()
  return data.data as { likesCount: number }
}

export async function deletePost(postId: string): Promise<void> {
  if (!/^[a-f0-9]{24}$/i.test(postId)) throw new Error("Invalid postId format")
  const res = await authenticatedFetch(`/api/posts/${postId}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete post: ${res.status}`)
}

export async function updatePost(
  postId: string,
  content: string,
  media?: SearchPostMedia[]
): Promise<void> {
  if (!/^[a-f0-9]{24}$/i.test(postId)) throw new Error("Invalid postId format")
  const res = await authenticatedFetch(`/api/posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, ...(media !== undefined ? { media } : {}) }),
  })
  if (!res.ok) throw new Error(`Failed to update post: ${res.status}`)
}

export async function getTrendingTags(limit = 10): Promise<TrendingTag[]> {
  try {
    const res = await authenticatedFetch(`/api/posts/trending-tags?limit=${limit}`)
    if (!res.ok) throw new Error(`Failed to get trending tags: ${res.status}`)
    const data = await res.json()
    return data.data as TrendingTag[]
  } catch (err) {
    if (typeof err === "object" && err !== null && "digest" in err) throw err
    return []
  }
}
