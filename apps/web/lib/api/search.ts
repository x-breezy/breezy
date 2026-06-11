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

export interface SearchUser {
    id: string
    username: string
}

export interface SearchProfile {
    profileId: string
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
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

export async function searchUsers(
    q: string,
    page = 1,
    limit = 20
): Promise<{ users: SearchUser[]; total: number; page: number; limit: number }> {
    const { data } = await apiClient.get("/api/users/search", { params: { q, page, limit } })
    return data.data as { users: SearchUser[]; total: number; page: number; limit: number }
}

export async function searchProfiles(
    q: string,
    page = 1,
    limit = 20
): Promise<{ profiles: SearchProfile[]; total: number; page: number; limit: number }> {
    const { data } = await apiClient.get("/api/profiles/search", { params: { q, page, limit } })
    return data.data as { profiles: SearchProfile[]; total: number; page: number; limit: number }
}

export async function fetchProfilesByIds(ids: string[]): Promise<SearchProfile[]> {
    if (ids.length === 0) return []
    const { data } = await apiClient.get("/api/profiles/batch", { params: { ids: ids.join(",") } })
    return (
        data.data as Array<{
            profileId: string
            username: string
            firstName: string | null
            lastName: string | null
            avatarId: string | null
        }>
    ).map((p) => ({
        profileId: p.profileId,
        firstName: p.firstName,
        lastName: p.lastName,
        avatarUrl: p.avatarId,
    }))
}

export async function getTrendingTags(limit = 10): Promise<TrendingTag[]> {
    const { data } = await apiClient.get("/api/posts/trending-tags", { params: { limit } })
    return data.data as TrendingTag[]
}
