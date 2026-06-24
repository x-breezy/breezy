import { useUserStore } from "@/stores/user-store"

export function useCurrentUser() {
  const profile = useUserStore((s) => s.profile)

  const changeUser = () => {
    // No-op since we don't mock users anymore
  }

  return { currentUserId: profile?.profileId, changeUser }
}
