import apiClient from "./client"
import type { RawProfile } from "./profiles"

export interface SearchPostMedia {
  id: string
  type: "image" | "video"
}

export interface SearchPost {
  _id: string
  content: string
  authorId: string
  tags: string[]
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

export async function searchPosts(
  q: string,
  page = 1,
  limit = 20
): Promise<PaginatedResult<SearchPost>> {
  // Resolve matching author IDs first, post-service needs them to include
  // author-based results. Sequential by design; profiles API is fast.
  const profilesRes = await apiClient
    .get("/api/profiles/search", { params: { q, page: 1, limit: 20 } })
    .catch(() => null)
  const authorIds: string[] =
    profilesRes?.data?.data?.profiles?.map((p: RawProfile) => p.profileId).filter(Boolean) ?? []

  const params: Record<string, unknown> = { q, page, limit }
  if (authorIds.length > 0) params.authorIds = authorIds.join(",")

  const { data } = await apiClient.get("/api/posts/search", { params })
  return data.data as PaginatedResult<SearchPost>
}

export async function getLikedPostIds(postIds: string[]): Promise<string[]> {
  if (postIds.length === 0) return []
  const { data } = await apiClient.get("/api/posts/liked-by-me", {
    params: { postIds: postIds.join(",") },
  })
  return data.data as string[]
}

export async function toggleLike(postId: string, liked: boolean): Promise<{ likesCount: number }> {
  if (liked) {
    const { data } = await apiClient.post(`/api/posts/${postId}/likes`)
    return data.data as { likesCount: number }
  } else {
    const { data } = await apiClient.delete(`/api/posts/${postId}/likes`)
    return data.data as { likesCount: number }
  }
}

export interface TrendingTag {
  tag: string
  count: number
}

export async function getTrendingTags(limit = 10): Promise<TrendingTag[]> {
  const { data } = await apiClient.get("/api/posts/trending-tags", { params: { limit } })
  return data.data as TrendingTag[]
}
