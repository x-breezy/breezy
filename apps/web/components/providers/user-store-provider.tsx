"use client"

import { useEffect } from "react"
import { useUserStore } from "@/stores/user-store"
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

  useEffect(() => {
    initialize(profile, user, following)
  }, [profile?.profileId, profile?.updatedAt, user?.id, user?.updatedAt])

  if (!initialized) return <AppLoader />

  return <>{children}</>
}
