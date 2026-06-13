"use client"

import { use, useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSection, ProfilePostsSection } from "@/components/profile"
import { useUserStore } from "@/stores/user-store"
import { useProfileStore } from "@/stores/profile-store"
import { UserRole } from "@/lib/auth/role"
import { AppLoader } from "@/components/layout/app-loader"
import { getProfileByUsernameAction } from "./actions"

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

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)

  const ownProfile = useUserStore((s) => s.profile)
  const user = useUserStore((s) => s.user)

  const cachedProfile = useProfileStore((s) => s.profiles[username])
  const cacheProfile = useProfileStore((s) => s.set)
  const [loading, setLoading] = useState(false)
  const [profileNotFound, setProfileNotFound] = useState(false)

  const isOwn = ownProfile?.username === username
  const profile = isOwn ? ownProfile : cachedProfile

  useEffect(() => {
    if (isOwn || cachedProfile) return
    setLoading(true)
    getProfileByUsernameAction(username).then((p) => {
      if (p) cacheProfile(username, p)
      else setProfileNotFound(true)
      setLoading(false)
    })
  }, [username, isOwn])

  if (loading) return <AppLoader />
  if (profileNotFound) notFound()
  if (!profile) return null

  return (
    <div>
      <ProfileHeader title={isOwn ? "My Profile" : `@${username}`} isOwn={isOwn} />

      <main className='md:px-4 md:py-6'>
        <ProfileSection profile={profile} role={user?.role as UserRole} isOwn={isOwn} />

        <ProfilePostsSection posts={MOCK_POSTS} className='mt-8' />
      </main>
    </div>
  )
}
