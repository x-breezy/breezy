"use client"

import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSection, ProfilePostsSection } from "@/components/profile"
import { useUserStore } from "@/stores/user-store"
import { UserRole } from "@/lib/auth/role"

const MOCK_POSTS = [
  {
    id: "1",
    author: {
      name: "Grod",
      username: "grod_le_goat",
      avatar: "/test/pp_test.png",
    },
    content:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets.",
    timestamp: "2h",
  },
]

export default function ProfilePage() {
  const profile = useUserStore((s) => s.profile)
  const user = useUserStore((s) => s.user)
  const role = user?.role as UserRole

  return (
    <div>
      <ProfileHeader />

      <main className='md:px-4 md:py-6'>
        {profile ? <ProfileSection profile={profile} role={role} /> : null}

        <ProfilePostsSection posts={MOCK_POSTS} className='mt-8' />
      </main>
    </div>
  )
}
