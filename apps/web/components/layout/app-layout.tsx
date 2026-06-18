import { NavBar } from "./navigation/nav-bar"
import { UserStoreProvider } from "../providers/user-store-provider"
import { getServerAuthHeader, getUserId } from "@/lib/auth/session"
import { getMe } from "@/lib/services/auth-service"
import { getFollowing, getProfile } from "@/lib/services/profile-service"
import { Profile } from "@/types/profile"
import { User } from "@/types/user"
import { NotificationStoreProvider } from "../providers/notification-store-provider"
import { NotificationToast } from "../notifications/notifications-toast"

interface AppLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
}

export async function AppLayout({ children, modal }: AppLayoutProps) {
  let profile: Profile | null = null
  let user: User | null = null
  const following: Record<string, boolean> = {}

  try {
    const userId = await getUserId()

    if (userId) {
      const authHeader = await getServerAuthHeader()
      const [res, meRes] = await Promise.all([getProfile(userId, authHeader), getMe(authHeader)])
      if (res.status === 200) profile = res.data.data as Profile
      if (meRes.status === 200) user = meRes.data.data as User

      if (profile) {
        const relRes = await getFollowing(profile.profileId, authHeader)
        if (relRes.status === 200) {
          for (const id of relRes.data.data.following) {
            following[id] = true
          }
        }
      }
    }
  } catch {
    // render without store data
  }

  return (
    <UserStoreProvider profile={profile} user={user} following={following}>
      <NotificationStoreProvider>
        <NotificationToast />
        <div className='flex h-dvh'>
          <NavBar />
          <main className='flex-1 overflow-y-auto pb-15 lg:pb-0 lg:pl-64'>{children}</main>
          {modal}
        </div>
      </NotificationStoreProvider>
    </UserStoreProvider>
  )
}
