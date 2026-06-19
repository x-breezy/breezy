"use client"

import { useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { IconLoader2, IconX } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import { PersonCard } from "@/components/search/person-card"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { useUserStore } from "@/stores/user-store"
import { followUserAction, unfollowUserAction } from "@/lib/actions/follow"
import { useFollowList, type FollowType } from "./use-follow-list"

interface FollowListDialogProps {
  profileId: string
  type: FollowType
  open: boolean
  onOpenChange: (open: boolean) => void
}

function FollowListHeader({
  type,
  total,
  onClose,
}: {
  type: FollowType
  total: number
  onClose: () => void
}) {
  const title = type === "followers" ? "Followers" : "Following"
  return (
    <PageHeader className='w-full bg-background'>
      <PageHeaderContent
        left={
          <button
            aria-label={`Close ${title}`}
            className='flex size-8 items-center justify-center text-foreground transition hover:opacity-70'
            onClick={onClose}
          >
            <IconX stroke={2} />
          </button>
        }
        center={
          <div className='flex flex-col items-center'>
            <h1 className='text-lg font-bold'>{title}</h1>
            {total > 0 && (
              <span className='text-xs text-muted-foreground'>
                {total} {type}
              </span>
            )}
          </div>
        }
        right={<div className='size-8' />}
      />
    </PageHeader>
  )
}

function FollowListBody({
  profileId,
  type,
  open,
  onClose,
}: {
  profileId: string
  type: FollowType
  open: boolean
  onClose: () => void
}) {
  const sentinelRef = useRef<HTMLDivElement>(null)
  const following = useUserStore((s) => s.following)
  const setRelation = useUserStore((s) => s.setRelation)
  const currentUserId = useUserStore((s) => s.profile?.profileId)

  const { profiles, total, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useFollowList(profileId, type, open)

  const handleFollow = useCallback(
    async (id: string, follow: boolean) => {
      if (follow) await followUserAction(id)
      else await unfollowUserAction(id)
      setRelation(id, follow)
    },
    [setRelation]
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <>
      <FollowListHeader type={type} total={total} onClose={onClose} />

      <div className='flex-1 overflow-y-auto'>
        {isLoading && (
          <div className='flex justify-center py-12'>
            <IconLoader2 size={24} className='animate-spin text-muted-foreground' />
          </div>
        )}

        {error && !isLoading && (
          <p className='px-4 py-8 text-center text-sm text-destructive'>Failed to load {type}</p>
        )}

        {!isLoading && !error && profiles.length === 0 && (
          <p className='px-4 py-8 text-center text-sm text-muted-foreground'>No {type} yet</p>
        )}

        {profiles.length > 0 && (
          <ul>
            {profiles.map((p) => {
              const displayName = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.username
              const username = p.username ?? ""
              return (
                <li key={p.profileId}>
                  <Link href={`/profile/${username}`}>
                    <PersonCard
                      id={p.profileId}
                      displayName={displayName}
                      username={username}
                      avatarUrl={p.avatarUrl || undefined}
                      bio={p.bio}
                      followersCount={p.followersCount}
                      initialFollowing={following[p.profileId] ?? false}
                      onFollow={handleFollow}
                      currentUserId={currentUserId}
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}

        {isFetchingNextPage && (
          <div className='flex justify-center py-4'>
            <IconLoader2 size={20} className='animate-spin text-muted-foreground' />
          </div>
        )}

        <div ref={sentinelRef} className='h-1' />
      </div>
    </>
  )
}

export function FollowListDialog({ profileId, type, open, onOpenChange }: FollowListDialogProps) {
  const isMobile = useIsMobile()
  const onClose = () => onOpenChange(false)

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed inset-0 z-120 flex flex-col bg-background outline-none'>
            <FollowListBody profileId={profileId} type={type} open={open} onClose={onClose} />
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className='z-120 flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:top-4 sm:max-w-lg sm:rounded-[min(var(--radius-4xl),24px)]'
      >
        <FollowListBody profileId={profileId} type={type} open={open} onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}
