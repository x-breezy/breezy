"use server"

import { getServerAuthHeader } from "@/lib/auth/session"
import { getFollowers, getFollowing, getProfilesByIds } from "@/lib/services/profile-service"
import { normalizeProfile, type SearchProfile } from "@/lib/api/profiles"

export interface FollowPage {
  profiles: SearchProfile[]
  total: number
  page: number
  limit: number
}

export async function listFollowers(profileId: string, page = 1, limit = 30): Promise<FollowPage> {
  const h = await getServerAuthHeader()
  const { data } = await getFollowers(profileId, h, page, limit)
  const { followers, count } = data.data
  if (followers.length === 0) {
    return { profiles: [], total: count, page, limit }
  }
  const batch = await getProfilesByIds(followers, h)
  const profiles = batch.data.data
    .map(normalizeProfile)
    .sort((a, b) => (a.username ?? "").localeCompare(b.username ?? ""))
  return { profiles, total: count, page, limit }
}

export async function listFollowing(profileId: string, page = 1, limit = 30): Promise<FollowPage> {
  const h = await getServerAuthHeader()
  const { data } = await getFollowing(profileId, h, page, limit)
  const { following, count } = data.data
  if (following.length === 0) {
    return { profiles: [], total: count, page, limit }
  }
  const batch = await getProfilesByIds(following, h)
  const profiles = batch.data.data
    .map(normalizeProfile)
    .sort((a, b) => (a.username ?? "").localeCompare(b.username ?? ""))
  return { profiles, total: count, page, limit }
}
