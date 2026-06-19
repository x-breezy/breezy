"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export interface MediaItem {
  id: string
  type: "image" | "video"
}

export interface ProfileRef {
  username: string
  avatarId: string | null
  firstName: string | null
  lastName: string | null
  role?: string
}

export interface PostData {
  _id: string
  content: string
  authorId: string
  parentId?: string
  tags: string[]
  mentions: string[]
  media: MediaItem[]
  likesCount: number
  commentsCount: number
  createdAt: string
  author: ProfileRef | null
}

export interface ReplyData {
  _id: string
  content: string
  authorId: string
  parentId?: string
  tags: string[]
  mentions: string[]
  media: MediaItem[]
  likesCount: number
  commentsCount: number
  createdAt: string
  author: ProfileRef | null
  likedByMe: boolean
  replies: ReplyData[]
}

export interface PostDetail {
  post: PostData
  likedByMe: boolean
  replies: ReplyData[]
}

export async function getPostDetail(postId: string): Promise<PostDetail | null> {
  if (!/^[a-f0-9]{24}$/i.test(postId)) return null

  const res = await authenticatedFetch(`/api/posts/${postId}/detail`)
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Failed to fetch post detail: ${res.status}`)
  }
  const json = await res.json()
  return json.data as PostDetail
}

export async function getPostsContext(ids: string[]): Promise<PostDetail[]> {
  const uniqueIds = [...new Set(ids.filter((id) => /^[a-f0-9]{24}$/i.test(id)))]
  const results = await Promise.allSettled(uniqueIds.map((id) => getPostDetail(id)))
  return results
    .filter((r) => r.status === "fulfilled" && r.value !== null)
    .map((r) => (r as PromiseFulfilledResult<PostDetail>).value)
}
