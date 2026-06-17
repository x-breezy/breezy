"use client"

import { use, useEffect, useState, useCallback } from "react"
import { notFound } from "next/navigation"
import { useTranslations } from "next-intl"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSection } from "@/components/profile"
import { useUserStore } from "@/stores/user-store"
import { useProfileStore } from "@/stores/profile-store"
import { UserRole } from "@/lib/auth/role"
import { AppLoader } from "@/components/layout/app-loader"
import { Skeleton } from "@/components/ui/skeleton"
import { getProfileByUsernameAction } from "./actions"
import { useProfilePosts } from "@/components/profile/use-profile-posts"
import Post from "@/components/post/post"
import { toggleLike } from "@/lib/actions/posts"

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params)
  const t = useTranslations("profilePage")

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

  const {
    posts,
    isLoading: postsLoading,
    fetchNextPage,
    hasNextPage,
  } = useProfilePosts(profile?.profileId ?? "")

  const handleLike = useCallback(async (postId: string, liked: boolean) => {
    const res = await toggleLike(postId, liked)
    return res.likesCount
  }, [])

  const authorName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || profile?.username || ""

  if (loading) return <AppLoader />
  if (profileNotFound) notFound()
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

        <section className='container-center mt-8 p-4 md:p-0'>
          {postsLoading ? (
            <div className='space-y-1'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex gap-2.5 p-3.5'>
                  <Skeleton className='size-11 shrink-0 rounded-full' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-3 w-32' />
                    <Skeleton className='h-3 w-full' />
                    <Skeleton className='h-3 w-4/5' />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>{t("noPosts")}</p>
          ) : (
            <>
              {posts.map((post) => (
                <Post
                  key={post._id}
                  id={post._id}
                  name={authorName}
                  username={profile.username}
                  authorId={post.authorId}
                  authorRole={profile.role}
                  avatarUrl={profile.avatarId ?? undefined}
                  content={post.content}
                  media={post.media}
                  createdAt={post.createdAt}
                  initialLikes={post.likesCount}
                  initialComments={post.commentsCount}
                  initialLiked={post.liked}
                  onLike={handleLike}
                  href={`/post/${profile.username}/${post._id}`}
                />
              ))}
              {hasNextPage && (
                <button
                  onClick={() => fetchNextPage()}
                  className='w-full py-3 text-sm text-muted-foreground transition-colors hover:text-foreground'
                >
                  Load more
                </button>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
