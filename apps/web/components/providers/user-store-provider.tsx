"use client"

import { useEffect } from "react"
import { useUserStore } from "@/stores/user-store"
import { Profile } from "@/types/profile"

interface Props {
  profile: Profile | null
  children: React.ReactNode
}

export function UserStoreProvider({ profile, children }: Props) {
  const initialize = useUserStore((s) => s.initialize)

  useEffect(() => {
    initialize(profile)
  }, [profile?.profileId, profile?.updatedAt])

  return <>{children}</>
}
