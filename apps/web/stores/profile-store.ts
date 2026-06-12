import { create } from "zustand"
import { Profile } from "@/types/profile"

interface ProfileStoreState {
  profiles: Record<string, Profile>
  set: (username: string, profile: Profile) => void
  update: (username: string, patch: Partial<Profile>) => void
}

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profiles: {},
  set: (username, profile) => set((s) => ({ profiles: { ...s.profiles, [username]: profile } })),
  update: (username, patch) =>
    set((s) => {
      const existing = s.profiles[username]
      if (!existing) return s
      return { profiles: { ...s.profiles, [username]: { ...existing, ...patch } } }
    }),
}))
