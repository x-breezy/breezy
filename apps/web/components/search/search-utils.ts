import type { SearchPost, SearchPostMedia } from "@/lib/api/posts"
import type { SearchProfile } from "@/lib/api/profiles"

export interface MergedPerson {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  followersCount: number
}

export function profilesToPeople(profiles: SearchProfile[]): MergedPerson[] {
  return profiles.map((p) => {
    const displayName = [p.firstName, p.lastName].filter(Boolean).join(" ") || null
    return {
      id: p.profileId,
      username: p.username ?? "",
      displayName,
      avatarUrl: p.avatarUrl,
      bio: p.bio ?? null,
      followersCount: p.followersCount ?? 0,
    }
  })
}

export function collectMedia(posts: SearchPost[]): SearchPostMedia[] {
  return posts.flatMap((post) => post.media ?? [])
}
