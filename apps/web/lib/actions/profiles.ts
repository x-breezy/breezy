"use server"

import { cookies } from "next/headers"

const API_URL = process.env.API_URL ?? "http://localhost"

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

async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function searchProfiles(
  q: string,
  page = 1,
  limit = 20
): Promise<{ profiles: SearchProfile[]; total: number; page: number; limit: number }> {
  const headers = await getAuthHeaders()
  const res = await fetch(
    `${API_URL}/api/profiles/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
    { headers }
  )
  if (!res.ok) throw new Error(`Failed to search profiles: ${res.status}`)
  const data = await res.json()
  const raw = data.data as { profiles: RawProfile[]; total: number; page: number; limit: number }
  return { ...raw, profiles: raw.profiles.map(normalizeProfile) }
}

export async function fetchProfilesByIds(ids: string[]): Promise<SearchProfile[]> {
  if (ids.length === 0) return []
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/profiles/batch?ids=${ids.join(",")}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch profiles: ${res.status}`)
  const data = await res.json()
  return (data.data as RawProfile[]).map(normalizeProfile)
}

export async function getSuggestedProfiles(profileId: string, limit = 3): Promise<SearchProfile[]> {
  try {
    const headers = await getAuthHeaders()
    const res = await fetch(`${API_URL}/api/profiles/${profileId}/suggestions?limit=${limit}`, {
      headers,
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.data as RawProfile[]).map(normalizeProfile)
  } catch {
    return []
  }
}
