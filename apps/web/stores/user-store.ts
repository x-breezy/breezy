import { create } from "zustand"
import { Profile } from "@/types/profile"

interface UserState {
  profile: Profile | null
  initialize: (profile: Profile | null) => void
  setProfile: (profile: Profile) => void
  clear: () => void
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  initialize: (profile) => set({ profile }),
  setProfile: (profile) => set({ profile }),
  clear: () => set({ profile: null }),
}))
