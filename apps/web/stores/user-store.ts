import { create } from "zustand"
import { Profile } from "@/types/profile"
import { User } from "@/types/user"

interface UserState {
  user: User | null
  profile: Profile | null
  initialized: boolean
  following: Record<string, boolean>
  initialize: (
    profile: Profile | null,
    user: User | null,
    following?: Record<string, boolean>
  ) => void
  setProfile: (profile: Profile) => void
  setUser: (user: User) => void
  setRelation: (profileId: string, isFollowing: boolean) => void
  clear: () => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  profile: null,
  initialized: false,
  following: {},
  initialize: (profile, user, following) =>
    set({ profile, user, initialized: true, following: following ?? {} }),
  setProfile: (profile) => set({ profile }),
  setUser: (user) => set({ user }),
  setRelation: (profileId, isFollowing) =>
    set((s) => ({ following: { ...s.following, [profileId]: isFollowing } })),
  clear: () => set({ profile: null, user: null, following: {} }),
}))
