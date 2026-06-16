"use server"

import { cookies } from "next/headers"

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:80"

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

function normalizeProfile(p: RawProfile): SearchProfile {
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
    `${GATEWAY_URL}/api/profiles/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
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
  const res = await fetch(`${GATEWAY_URL}/api/profiles/batch?ids=${ids.join(",")}`, { headers })
  if (!res.ok) throw new Error(`Failed to fetch profiles: ${res.status}`)
  const data = await res.json()
  return (data.data as RawProfile[]).map(normalizeProfile)
}

export async function followProfile(followingId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${GATEWAY_URL}/api/profiles/follow`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ followingId }),
  })
  if (!res.ok) throw new Error(`Failed to follow profile: ${res.status}`)
}

export async function unfollowProfile(followingId: string): Promise<void> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${GATEWAY_URL}/api/profiles/unfollow`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ followingId }),
  })
  if (!res.ok) throw new Error(`Failed to unfollow profile: ${res.status}`)
}
