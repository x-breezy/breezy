"use server"

import { getServerAuthHeader } from "@/lib/auth/session"
import { followUser } from "@/lib/services/profile-service"

export async function followUserAction(targetId: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  await followUser(targetId, authHeader)
}
