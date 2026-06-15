"use server"

import { cookies } from "next/headers"

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:80"

export interface SearchPostMedia {
    id: string
    type: "image" | "video"
}

export interface CreatePostInput {
    content: string
    tags: string[]
    mentions: string[]
    media: SearchPostMedia[]
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

export interface TrendingTag {
    tag: string
    count: number
}

async function getAuthHeaders(): Promise<Record<string, string>> {
    const cookieStore = await cookies()
    const token = cookieStore.get("breezy-token")?.value
    return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function createPost(input: CreatePostInput): Promise<void> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${GATEWAY_URL}/api/posts/`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
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
    const headers = await getAuthHeaders()
    const params = new URLSearchParams({ q, page: String(page), limit: String(limit) })
    if (authorIds?.length) params.set("authorIds", authorIds.join(","))

    const res = await fetch(`${GATEWAY_URL}/api/posts/search?${params}`, { headers })
    if (!res.ok) throw new Error(`Failed to search posts: ${res.status}`)
    const data = await res.json()
    return data.data as PaginatedResult<SearchPost>
}

export async function getLikedPostIds(postIds: string[]): Promise<string[]> {
    if (postIds.length === 0) return []
    const headers = await getAuthHeaders()
    const res = await fetch(
        `${GATEWAY_URL}/api/posts/liked-by-me?postIds=${postIds.join(",")}`,
        { headers }
    )
    if (!res.ok) throw new Error(`Failed to get liked posts: ${res.status}`)
    const data = await res.json()
    return data.data as string[]
}

export async function toggleLike(
    postId: string,
    liked: boolean
): Promise<{ likesCount: number }> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${GATEWAY_URL}/api/posts/${postId}/likes`, {
        method: liked ? "POST" : "DELETE",
        headers,
    })
    if (!res.ok) throw new Error(`Failed to toggle like: ${res.status}`)
    const data = await res.json()
    return data.data as { likesCount: number }
}

export async function getTrendingTags(limit = 10): Promise<TrendingTag[]> {
    const headers = await getAuthHeaders()
    const res = await fetch(`${GATEWAY_URL}/api/posts/trending-tags?limit=${limit}`, { headers })
    if (!res.ok) throw new Error(`Failed to get trending tags: ${res.status}`)
    const data = await res.json()
    return data.data as TrendingTag[]
}
