"use server"

import { getServerAuthHeader } from "@/lib/auth/session"
import { getProfileByUsername, getIsFollowing } from "@/lib/services/profile-service"
import { Profile } from "@/types/profile"

export async function getIsFollowingAction(profileId: string): Promise<boolean> {
  try {
    const authHeader = await getServerAuthHeader()
    const res = await getIsFollowing(profileId, authHeader)
    return res.data.data.isFollowing
  } catch {
    return false
  }
}

export async function getProfileByUsernameAction(username: string): Promise<Profile | null> {
  try {
    const authHeader = await getServerAuthHeader()
    const res = await getProfileByUsername(username, authHeader)
    if (res.status === 200) return res.data.data as Profile
    return null
  } catch {
    return null
  }
}
