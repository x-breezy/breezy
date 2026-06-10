"use client"

import { useEffect } from "react"
import { useUserStore } from "@/stores/user-store"
import { Profile } from "@/types/profile"
import { User } from "@/types/user"

interface Props {
  profile: Profile | null
  user: User | null
  children: React.ReactNode
}

export function UserStoreProvider({ profile, user, children }: Props) {
  const initialize = useUserStore((s) => s.initialize)

  useEffect(() => {
    initialize(profile, user)
  }, [profile?.profileId, profile?.updatedAt, user?.id, user?.updatedAt])

  return <>{children}</>
}
