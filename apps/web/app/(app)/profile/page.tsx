"use client"

import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSection, ProfilePostsSection } from "@/components/profile"
import { useUserStore } from "@/stores/user-store"
import type { UserRole } from "@/components/profile/profile-badge"

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

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || profile?.username || ""
  const username = profile?.username ?? ""
  const avatar = profile?.avatarId ?? ""
  const role = "user" as UserRole
  const followers = profile?.followersCount ?? 0
  const following = profile?.followingCount ?? 0
  const bio = profile?.bio ?? ""

  return (
    <div>
      <ProfileHeader />

      <main className='md:px-4 md:py-6'>
        <ProfileSection
          avatar={avatar}
          name={name}
          username={username}
          role={role}
          followers={followers}
          following={following}
          bio={bio}
        />

        <ProfilePostsSection posts={MOCK_POSTS} className='mt-8' />
      </main>
    </div>
  )
}
