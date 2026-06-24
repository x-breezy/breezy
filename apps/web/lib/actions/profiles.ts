"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export interface SearchProfile {
  profileId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  bio: string | null
  followersCount: number
  role?: string
}

export interface RawProfile {
  profileId: string
  username: string | null
  firstName: string | null
  lastName: string | null
  avatarId: string | null
  bio: string | null
  followersCount: number
  role?: string
}

function normalizeProfile(p: RawProfile): SearchProfile {
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

export async function searchProfiles(
  q: string,
  page = 1,
  limit = 20
): Promise<{ profiles: SearchProfile[]; total: number; page: number; limit: number }> {
  const params = new URLSearchParams({
    q: q.toLowerCase(),
    page: String(page),
    limit: String(limit),
  })
  const res = await authenticatedFetch(`/api/profiles/search?${params}`)
  if (!res.ok) throw new Error(`Failed to search profiles: ${res.status}`)
  const data = await res.json()
  const raw = data.data as { profiles: RawProfile[]; total: number; page: number; limit: number }
  return { ...raw, profiles: raw.profiles.map(normalizeProfile) }
}

export async function fetchProfilesByIds(ids: string[]): Promise<SearchProfile[]> {
  if (ids.length === 0) return []
  const res = await authenticatedFetch(`/api/profiles/batch?ids=${ids.join(",")}`)
  if (!res.ok) throw new Error(`Failed to fetch profiles: ${res.status}`)
  const data = await res.json()
  return (data.data as RawProfile[]).map(normalizeProfile)
}

export async function getSuggestedProfiles(profileId: string, limit = 3): Promise<SearchProfile[]> {
  try {
    const res = await authenticatedFetch(`/api/profiles/${profileId}/suggestions?limit=${limit}`)
    if (!res.ok) return []
    const data = await res.json()
    return (data.data as RawProfile[]).map(normalizeProfile)
  } catch (err) {
    if (typeof err === "object" && err !== null && "digest" in err) throw err
    return []
  }
}
