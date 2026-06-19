import type { SearchPost, SearchPostMedia } from "@/lib/actions/posts"
import type { SearchProfile } from "@/lib/actions/profiles"

export interface MergedPerson {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | undefined
  bio: string | null
  followersCount: number
  role?: string
}

export function profilesToPeople(profiles: SearchProfile[]): MergedPerson[] {
  return profiles.map((p) => {
    const displayName = [p.firstName, p.lastName].filter(Boolean).join(" ") || null
    return {
      id: p.profileId,
      username: p.username ?? "",
      displayName,
      avatarUrl: p.avatarUrl || undefined,
      bio: p.bio ?? null,
      followersCount: p.followersCount ?? 0,
      role: p.role,
    }
  })
}

export function collectMedia(posts: SearchPost[]): SearchPostMedia[] {
  return posts.flatMap((post) => post.media ?? [])
}
