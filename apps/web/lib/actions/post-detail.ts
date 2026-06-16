"use server"

import { cookies } from "next/headers"

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:80"

export interface MediaItem {
  id: string
  type: "image" | "video"
}

export interface ProfileRef {
  username: string
  avatarId: string | null
  firstName: string | null
  lastName: string | null
}

interface PostData {
  _id: string
  content: string
  authorId: string
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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getPostDetail(postId: string): Promise<PostDetail | null> {
  if (!/^[a-f0-9]{24}$/i.test(postId)) return null

  const headers = await getAuthHeaders()
  const res = await fetch(`${GATEWAY_URL}/api/posts/${postId}/detail`, { headers })
  if (!res.ok) {
    if (res.status === 404) return null
    throw new Error(`Failed to fetch post detail: ${res.status}`)
  }
  const json = await res.json()
  return json.data as PostDetail
}
