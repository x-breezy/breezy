import type { SearchProfile, SearchPost, SearchPostMedia } from "@/lib/api/search"

export interface MergedPerson {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
}

export function profilesToPeople(profiles: SearchProfile[]): MergedPerson[] {
    return profiles.map((p) => {
        const displayName = [p.firstName, p.lastName].filter(Boolean).join(" ") || null
        return {
            id: p.profileId,
            username: p.username ?? "",
            displayName,
            avatarUrl: p.avatarUrl,
        }
    })
}

export function collectMedia(posts: SearchPost[]): SearchPostMedia[] {
    return posts.flatMap((post) => post.media ?? [])
}
