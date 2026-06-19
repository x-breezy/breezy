"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUserStore } from "@/stores/user-store"
import { useSettingsStore } from "@/stores/settings-store"
import { checkSanctionStatus } from "@/lib/actions/settings"
import { Profile } from "@/types/profile"
import { User } from "@/types/user"
import { AppLoader } from "@/components/layout/app-loader"

const POLL_INTERVAL_MS = 10_000

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
  const router = useRouter()

  useEffect(() => {
    initialize(profile, user, following)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.profileId, profile?.updatedAt, user?.id, user?.updatedAt])

  useEffect(() => {
    syncFromUser(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.updatedAt, syncFromUser])

  // Poll sanction status while the user is active in the app
  useEffect(() => {
    if (!user) return
    const id = setInterval(async () => {
      const reason = await checkSanctionStatus()
      if (reason) {
        router.replace(`/sign-in?reason=${reason}`)
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!initialized) return <AppLoader />

  return <>{children}</>
}
