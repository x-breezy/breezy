import serverClient from "@/lib/api/server-client"
import { Profile } from "@/types/profile"
import type { RawProfile } from "@/lib/api/profiles"

export function getProfile(profileId: string, authHeader: Record<string, string>) {
  return serverClient.get<{ success: boolean; data: Profile }>(`/api/profiles/${profileId}`, {
    headers: authHeader,
  })
}

export function updateProfile(
  profileId: string,
  payload: Partial<Profile>,
  authHeader: Record<string, string>
) {
  const payloadWithId = { ...payload, profileId }
  return serverClient.patch(`/api/profiles/`, payloadWithId, { headers: authHeader })
}

export function getProfileByUsername(username: string, authHeader: Record<string, string>) {
  return serverClient.get<{ success: boolean; data: Profile }>(
    `/api/profiles/by-username/${username}`,
    {
      headers: authHeader,
    }
  )
}

export function getFollowers(
  profileId: string,
  authHeader: Record<string, string>,
  page = 1,
  limit = 30
) {
  return serverClient.get<{
    success: boolean
    data: { count: number; followers: string[]; page: number; limit: number }
  }>(`/api/profiles/${profileId}/followers`, { params: { page, limit }, headers: authHeader })
}

export function getFollowing(
  profileId: string,
  authHeader: Record<string, string>,
  page = 1,
  limit = 30
) {
  return serverClient.get<{
    success: boolean
    data: { count: number; following: string[]; page: number; limit: number }
  }>(`/api/profiles/${profileId}/following`, { params: { page, limit }, headers: authHeader })
}

export function getProfilesByIds(ids: string[], authHeader: Record<string, string>) {
  return serverClient.get<{ success: boolean; data: RawProfile[] }>(`/api/profiles/batch`, {
    params: { ids: ids.join(",") },
    headers: authHeader,
  })
}

export function getIsFollowing(profileId: string, authHeader: Record<string, string>) {
  return serverClient.get<{ success: boolean; data: { isFollowing: boolean } }>(
    `/api/profiles/${profileId}/is-following`,
    { headers: authHeader }
  )
}

export function followUser(targetId: string, authHeader: Record<string, string>) {
  return serverClient.post(
    `/api/profiles/follow`,
    { followingId: targetId },
    { headers: authHeader }
  )
}

export function unfollowUser(targetId: string, authHeader: Record<string, string>) {
  return serverClient.post(
    `/api/profiles/unfollow`,
    { followingId: targetId },
    { headers: authHeader }
  )
}
