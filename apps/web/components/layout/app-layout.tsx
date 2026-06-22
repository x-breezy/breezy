import { redirect } from "next/navigation"
import { NavBar } from "./navigation/nav-bar"
import { RightSidebar } from "./right-sidebar"
import { UserStoreProvider } from "../providers/user-store-provider"
import { clearSessionCookies, getServerAuthHeader, getUserId } from "@/lib/auth/session"
import { getMe } from "@/lib/services/auth-service"
import { getFollowing, getProfile } from "@/lib/services/profile-service"
import { getSuggestedProfiles } from "@/lib/actions/profiles"
import type { SearchProfile } from "@/lib/actions/profiles"
import { Profile } from "@/types/profile"
import { User } from "@/types/user"
import { NotificationStoreProvider } from "../providers/notification-store-provider"
import { NotificationToast } from "../notifications/notifications-toast"
import { MessageNotificationToast } from "../messages/message-notification-toast"

interface AppLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
}

export async function AppLayout({ children, modal }: AppLayoutProps) {
  let profile: Profile | null = null
  let user: User | null = null
  let suggestedUsers: SearchProfile[] = []
  const following: Record<string, boolean> = {}

  try {
    const userId = await getUserId()

    if (userId) {
      const authHeader = await getServerAuthHeader()
      const [res, meRes] = await Promise.all([getProfile(userId, authHeader), getMe(authHeader)])
      if (res.status === 200) profile = res.data.data as Profile
      if (meRes.status === 200) user = meRes.data.data as User

      if (user?.isBanned) {
        await clearSessionCookies()
        redirect("/sign-in?reason=banned")
      }

      if (profile) {
        const relRes = await getFollowing(profile.profileId, authHeader)

        if (relRes.status === 200) {
          for (const id of relRes.data.data.following) {
            following[id] = true
          }
        }

        suggestedUsers = await getSuggestedProfiles(profile.profileId, 3)
      }
    }
  } catch (err) {
    // Re-throw Next.js redirect/notFound internals so they are not swallowed
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err
    // Otherwise render without store data
  }

  return (
    <UserStoreProvider profile={profile} user={user} following={following}>
      <NotificationStoreProvider>
        <NotificationToast />
        <MessageNotificationToast />
        <div className='flex h-dvh'>
          <div className='flex min-w-0 flex-1'>
            <div className='mx-auto flex w-full max-w-[1400px]'>
              <NavBar />
              <main className='min-w-0 flex-1 overflow-y-hidden border-x pb-15 lg:pb-0'>
                {children}
              </main>
              <aside className='hidden w-[350px] shrink-0 overflow-y-auto xl:block'>
                <RightSidebar suggestedUsers={suggestedUsers} />
              </aside>
            </div>
          </div>
          {modal}
        </div>
      </NotificationStoreProvider>
    </UserStoreProvider>
  )
}
