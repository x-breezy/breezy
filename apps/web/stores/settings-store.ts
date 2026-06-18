import { create } from "zustand"
import type { User } from "@/types/user"
import { logoutAction } from "@/lib/actions/settings"

interface SettingsStoreState {
  twoFactorEnabled: boolean
  isEmailVerified: boolean
  theme: string
  locale: string
  loading: boolean
  error: string | null

  syncFromUser: (user: User | null) => void
  setTheme: (theme: string) => void
  setLocale: (locale: string) => void
  logout: () => Promise<void>
  clear: () => void
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  twoFactorEnabled: false,
  isEmailVerified: false,
  theme: "system",
  locale: "en",
  loading: false,
  error: null,

  syncFromUser: (user) => {
    if (!user) return
    set({
      twoFactorEnabled: user.twoFactorEnabled,
      isEmailVerified: user.isEmailVerified,
    })
  },

  setTheme: (theme) => {
    set({ theme })
  },

  setLocale: (locale) => {
    set({ locale })
  },

  logout: async () => {
    set({ loading: true, error: null })
    try {
      await logoutAction()
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
      throw e
    }
  },

  clear: () => {
    set({
      twoFactorEnabled: false,
      isEmailVerified: false,
      theme: "system",
      locale: "en",
      loading: false,
      error: null,
    })
  },
}))
