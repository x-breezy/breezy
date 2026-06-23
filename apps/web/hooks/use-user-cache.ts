import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserCacheState {
  users: Record<string, { displayName: string; avatarUrl?: string }>
  setUser: (id: string, data: { displayName: string; avatarUrl?: string }) => void
}

export const useUserCache = create<UserCacheState>()(
  persist(
    (set) => ({
      users: {},
      setUser: (id, data) => set((state) => ({ users: { ...state.users, [id]: data } })),
    }),
    {
      name: "user-cache-storage",
    }
  )
)
