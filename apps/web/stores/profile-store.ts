import { create } from "zustand"
import type { Profile } from "@/types/profile"
import { getProfileByUsernameAction, getIsFollowingAction } from "@/lib/actions/profile-username"
import { followUserAction, unfollowUserAction } from "@/lib/actions/follow"

interface ProfileStoreState {
  profiles: Record<string, Profile>
  loading: Record<string, boolean>
  error: string | null

  set: (username: string, profile: Profile) => void
  update: (username: string, patch: Partial<Profile>) => void
  fetchByUsername: (username: string) => Promise<Profile | null>
  fetchIsFollowing: (profileId: string) => Promise<boolean>
  follow: (profileId: string, username: string) => Promise<void>
  unfollow: (profileId: string, username: string) => Promise<void>
  clear: () => void
}

const _inFlight = new Set<string>()

export const useProfileStore = create<ProfileStoreState>((set, get) => ({
  profiles: {},
  loading: {},
  error: null,

  set: (username, profile) => set((s) => ({ profiles: { ...s.profiles, [username]: profile } })),

  update: (username, patch) =>
    set((s) => {
      const existing = s.profiles[username]
      if (!existing) return s
      return { profiles: { ...s.profiles, [username]: { ...existing, ...patch } } }
    }),

  fetchByUsername: async (username) => {
    const cached = get().profiles[username]
    if (cached) return cached
    if (_inFlight.has(username)) return null

    _inFlight.add(username)
    set((s) => ({ loading: { ...s.loading, [username]: true }, error: null }))
    try {
      const profile = await getProfileByUsernameAction(username)
      if (profile) {
        set((s) => ({
          profiles: { ...s.profiles, [username]: profile },
          loading: { ...s.loading, [username]: false },
        }))
      } else {
        set((s) => ({ loading: { ...s.loading, [username]: false } }))
      }
      return profile
    } catch (e) {
      set((s) => ({
        error: (e as Error).message,
        loading: { ...s.loading, [username]: false },
      }))
      return null
    } finally {
      _inFlight.delete(username)
    }
  },

  fetchIsFollowing: async (profileId) => {
    try {
      return await getIsFollowingAction(profileId)
    } catch {
      return false
    }
  },

  follow: async (profileId, username) => {
    const cached = get().profiles[username]
    set((s) => ({
      profiles: cached
        ? { ...s.profiles, [username]: { ...cached, followersCount: cached.followersCount + 1 } }
        : s.profiles,
    }))
    try {
      const res = await followUserAction(profileId)
      if (res.alreadyFollowing) {
        set((s) => ({
          profiles: cached
            ? {
                ...s.profiles,
                [username]: { ...cached, followersCount: cached.followersCount - 1 },
              }
            : s.profiles,
        }))
      }
    } catch {
      set((s) => ({
        profiles: cached
          ? { ...s.profiles, [username]: { ...cached, followersCount: cached.followersCount } }
          : s.profiles,
      }))
      throw new Error("Failed to follow")
    }
  },

  unfollow: async (profileId, username) => {
    const cached = get().profiles[username]
    set((s) => ({
      profiles: cached
        ? { ...s.profiles, [username]: { ...cached, followersCount: cached.followersCount - 1 } }
        : s.profiles,
    }))
    try {
      await unfollowUserAction(profileId)
    } catch {
      set((s) => ({
        profiles: cached
          ? { ...s.profiles, [username]: { ...cached, followersCount: cached.followersCount } }
          : s.profiles,
      }))
      throw new Error("Failed to unfollow")
    }
  },

  clear: () => {
    _inFlight.clear()
    set({ profiles: {}, loading: {}, error: null })
  },
}))
