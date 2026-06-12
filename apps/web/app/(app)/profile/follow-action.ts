"use server"

import { getServerAuthHeader } from "@/lib/auth/session"
import { followUser, unfollowUser } from "@/lib/services/profile-service"

export async function followUserAction(targetId: string): Promise<{ alreadyFollowing?: boolean }> {
  try {
    const authHeader = await getServerAuthHeader()
    await followUser(targetId, authHeader)
    return {}
  } catch (err: unknown) {
    if ((err as { response?: { status?: number } })?.response?.status === 409) {
      return { alreadyFollowing: true }
    }
    throw err
  }
}

export async function unfollowUserAction(targetId: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  await unfollowUser(targetId, authHeader)
}
