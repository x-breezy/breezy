import { create } from "zustand"
import { Profile } from "@/types/profile"
import { User } from "@/types/user"

interface UserState {
  user: User | null
  profile: Profile | null
  initialize: (profile: Profile | null, user: User | null) => void
  setProfile: (profile: Profile) => void
  setUser: (user: User) => void
  clear: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  initialize: (profile, user) => set({ profile, user }),
  setProfile: (profile) => set({ profile }),
  setUser: (user) => set({ user }),
  clear: () => set({ profile: null, user: null }),
}))
