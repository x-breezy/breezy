import apiClient from "./client"

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

export interface SearchProfile {
    profileId: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
}

interface RawProfile {
    profileId: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarId: string | null
}

function normalizeProfile(p: RawProfile): SearchProfile {
    return {
        profileId: p.profileId,
        username: p.username,
        firstName: p.firstName,
        lastName: p.lastName,
        avatarUrl: p.avatarId,
    }
}

export interface TrendingTag {
    tag: string
    count: number
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
    const { data } = await apiClient.get("/api/posts/search", { params: { q, page, limit } })
    return data.data as PaginatedResult<SearchPost>
}

export async function searchProfiles(
    q: string,
    page = 1,
    limit = 20
): Promise<{ profiles: SearchProfile[]; total: number; page: number; limit: number }> {
    const { data } = await apiClient.get("/api/profiles/search", { params: { q, page, limit } })
    const raw = data.data as { profiles: RawProfile[]; total: number; page: number; limit: number }
    return { ...raw, profiles: raw.profiles.map(normalizeProfile) }
}

export async function fetchProfilesByIds(ids: string[]): Promise<SearchProfile[]> {
    if (ids.length === 0) return []
    const { data } = await apiClient.get("/api/profiles/batch", { params: { ids: ids.join(",") } })
    return (data.data as RawProfile[]).map(normalizeProfile)
}

export async function getTrendingTags(limit = 10): Promise<TrendingTag[]> {
    const { data } = await apiClient.get("/api/posts/trending-tags", { params: { limit } })
    return data.data as TrendingTag[]
}
