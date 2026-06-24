import type { SearchProfile, RawProfile } from "@/lib/actions/profiles"
export type { SearchProfile, RawProfile } from "@/lib/actions/profiles"
export { searchProfiles, fetchProfilesByIds } from "@/lib/actions/profiles"
export {
  followUserAction as followProfile,
  unfollowUserAction as unfollowProfile,
} from "@/lib/actions/follow"

export function normalizeProfile(p: RawProfile): SearchProfile {
  return {
    profileId: p.profileId,
    username: p.username,
    firstName: p.firstName,
    lastName: p.lastName,
    avatarUrl: p.avatarId,
    bio: p.bio ?? null,
    followersCount: p.followersCount ?? 0,
    role: p.role,
  }
}
