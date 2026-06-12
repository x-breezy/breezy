import apiClient from "./client"

export interface SearchProfile {
    profileId: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    bio: string | null
    followersCount: number
}

export interface RawProfile {
    profileId: string
    username: string | null
    firstName: string | null
    lastName: string | null
    avatarId: string | null
    bio: string | null
    followersCount: number
}

export function normalizeProfile(p: RawProfile): SearchProfile {
    return {
        profileId: p.profileId,
        username: p.username,
        firstName: p.firstName,
        lastName: p.lastName,
        avatarUrl: p.avatarId,
        bio: p.bio ?? null,
        followersCount: p.followersCount ?? 0,
    }
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

export async function followProfile(followingId: string): Promise<void> {
    await apiClient.post("/api/profiles/follow", { followingId })
}

export async function unfollowProfile(followingId: string): Promise<void> {
    await apiClient.post("/api/profiles/unfollow", { followingId })
}
