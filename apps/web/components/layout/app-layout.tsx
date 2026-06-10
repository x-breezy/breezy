import { NavBar } from "../navigation/nav-bar"
import { UserStoreProvider } from "../providers/user-store-provider"
import { getServerAuthHeader, getUserId } from "@/lib/auth/session"
import { getProfile } from "@/lib/services/profile-service"
import { Profile } from "@/types/profile"

interface AppLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
}

export async function AppLayout({ children, modal }: AppLayoutProps) {
  let profile: Profile | null = null

  try {
    const userId = await getUserId()

    if (userId) {
      const authHeader = await getServerAuthHeader()
      const res = await getProfile(userId, authHeader)
      if (res.status === 200) profile = res.data.data as Profile
    }
  } catch {
    // render without store data
  }

  return (
    <UserStoreProvider profile={profile}>
      <div className='flex h-dvh'>
        <NavBar />
        <main className='flex-1 overflow-y-auto pb-15 lg:pb-0 lg:pl-64'>{children}</main>
        {modal}
      </div>
    </UserStoreProvider>
  )
}
