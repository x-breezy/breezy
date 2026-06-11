import type { SearchUser, SearchProfile, SearchPost, SearchPostMedia } from "@/lib/api/search"

export interface MergedPerson {
    id: string
    username: string | undefined
    displayName: string | null
    avatarUrl: string | null
}

export function mergeByProfileId(users: SearchUser[], profiles: SearchProfile[]): MergedPerson[] {
    const profileMap = new Map(profiles.map((p) => [p.profileId, p]))
    const seen = new Set<string>()
    const result: MergedPerson[] = []

    for (const u of users) {
        seen.add(u.id)
        const profile = profileMap.get(u.id)
        const firstName = profile?.firstName ?? null
        const lastName = profile?.lastName ?? null
        const displayName = [firstName, lastName].filter(Boolean).join(" ") || null
        result.push({ id: u.id, username: u.username, displayName, avatarUrl: profile?.avatarUrl ?? null })
    }

    for (const p of profiles) {
        if (seen.has(p.profileId)) continue
        const firstName = p.firstName ?? null
        const lastName = p.lastName ?? null
        const displayName = [firstName, lastName].filter(Boolean).join(" ") || null
        result.push({ id: p.profileId, username: undefined, displayName, avatarUrl: p.avatarUrl })
    }

    return result
}

export function collectMedia(posts: SearchPost[]): SearchPostMedia[] {
    return posts.flatMap((post) => post.media ?? [])
}
