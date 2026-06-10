import serverClient from "@/lib/api/server-client"
import { Profile } from "@/types/profile"

export function getProfile(profileId: string, authHeader: Record<string, string>) {
  return serverClient.get(`/api/profiles/${profileId}`, { headers: authHeader })
}

export function updateProfile(
  profileId: string,
  payload: Partial<Profile>,
  authHeader: Record<string, string>
) {
  const payloadWithId = { ...payload, profileId }
  return serverClient.patch(`/api/profiles/`, payloadWithId, { headers: authHeader })
}
