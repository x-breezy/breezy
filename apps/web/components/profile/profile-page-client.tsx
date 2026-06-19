"use client"

import { useEffect, useCallback, useMemo } from "react"
import { notFound, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSection } from "@/components/profile"
import { ProfileTabs, type ProfileTab } from "@/components/profile/profile-tabs"
import { ProfilePostsList } from "@/components/profile/profile-posts-list"
import { ProfileRepliesList } from "@/components/profile/profile-replies-list"
import { ProfileMediaList } from "@/components/profile/profile-media-list"
import { useUserStore } from "@/stores/user-store"
import { useProfileStore } from "@/stores/profile-store"
import { usePostStore } from "@/stores/post-store"
import { UserRole } from "@/lib/auth/role"
import { AppLoader } from "@/components/layout/app-loader"
import { useProfilePosts } from "@/components/profile/use-profile-posts"
import { useProfileReplies } from "@/components/profile/use-profile-replies"
import type { ProfileRef } from "@/lib/actions/post-detail"

const VALID_TABS: ProfileTab[] = ["posts", "replies", "medias"]

function parseProfileTab(value: string | null): ProfileTab {
  return VALID_TABS.includes(value as ProfileTab) ? (value as ProfileTab) : "posts"
}

export function ProfilePageClient({ username }: { username: string }) {
  const t = useTranslations("profilePage")
  const searchParams = useSearchParams()
  const tab = parseProfileTab(searchParams.get("tab"))

  const ownProfile = useUserStore((s) => s.profile)
  const fetchProfile = useProfileStore((s) => s.fetchByUsername)
  const loadingMap = useProfileStore((s) => s.loading)
  const profileLoading = username in loadingMap ? loadingMap[username] : false
  const profileError = useProfileStore((s) => s.error)
  const toggleLike = usePostStore((s) => s.toggleLike)

  const cachedProfile = useProfileStore((s) => s.profiles[username])

  const isOwn = ownProfile?.username === username
  const profile = isOwn ? ownProfile : cachedProfile

  useEffect(() => {
    if (isOwn) return
    fetchProfile(username)
  }, [username, isOwn, fetchProfile])

  const isRepliesTab = tab === "replies"
  const isMediasTab = tab === "medias"
  const tabType = isMediasTab ? "media" : isRepliesTab ? "all" : tab

  const {
    posts,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
  } = useProfilePosts(profile?.profileId ?? "", tabType, !isRepliesTab)

  const profileRef = useMemo<ProfileRef | null>(
    () =>
      profile
        ? {
            username: profile.username,
            avatarId: profile.avatarId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role,
          }
        : null,
    [profile]
  )

  const { threads, isLoading: repliesLoading } = useProfileReplies(
    profile?.profileId ?? "",
    profileRef,
    isRepliesTab
  )

  const handleLike = useCallback(
    async (postId: string, liked: boolean) => {
      return toggleLike(postId, liked)
    },
    [toggleLike]
  )

  const authorName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || profile?.username || ""

  if (profileLoading) return <AppLoader />
  if (profileError && !profile) notFound()
  if (!profile) return null

  return (
    <div>
      <ProfileHeader
        title={isOwn ? t("myProfile") : `@${username}`}
        name={!isOwn ? authorName : undefined}
        role={!isOwn ? (profile.role as UserRole) : undefined}
        isOwn={isOwn}
      />

      <main className='md:px-4 md:py-6'>
        <ProfileSection profile={profile} role={profile.role as UserRole} isOwn={isOwn} />

        <ProfileTabs />

        <section className='container-center p-4 md:p-0'>
          {isRepliesTab ? (
            <ProfileRepliesList threads={threads} isLoading={repliesLoading} />
          ) : isMediasTab ? (
            <ProfileMediaList posts={posts} isLoading={postsLoading} />
          ) : (
            <ProfilePostsList
              posts={posts}
              isLoading={postsLoading}
              hasNextPage={hasNextPage}
              onLoadMore={fetchNextPage}
              authorName={authorName}
              profile={profile}
              onLike={handleLike}
            />
          )}
        </section>
      </main>
    </div>
  )
}
