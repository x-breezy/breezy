"use client"

import { useEffect } from "react"
import { useUserStore } from "@/stores/user-store"
import { useSettingsStore } from "@/stores/settings-store"
import { Profile } from "@/types/profile"
import { User } from "@/types/user"
import { AppLoader } from "@/components/layout/app-loader"

interface Props {
  profile: Profile | null
  user: User | null
  following?: Record<string, boolean>
  children: React.ReactNode
}

export function UserStoreProvider({ profile, user, following, children }: Props) {
  const initialize = useUserStore((s) => s.initialize)
  const initialized = useUserStore((s) => s.initialized)
  const syncFromUser = useSettingsStore((s) => s.syncFromUser)

  useEffect(() => {
    initialize(profile, user, following)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.profileId, profile?.updatedAt, user?.id, user?.updatedAt])

  useEffect(() => {
    syncFromUser(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.updatedAt, syncFromUser])

  if (!initialized) return <AppLoader />

  return <>{children}</>
}
