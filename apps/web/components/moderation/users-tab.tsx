"use client"

import { useState, useTransition, useEffect, useRef, useCallback } from "react"
import { IconAlertTriangle, IconUserPlus, IconUsers } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"
import { listAllUsers } from "@/lib/actions/users"
import UserCard from "./user-card"
import AddUserDialog from "./add-user-dialog"

type Filter = "all" | "banned"

export function UsersTab() {
  const t = useTranslations("moderationPage")
  const currentUser = useUserStore((s) => s.user)
  const isAdmin = currentUser?.role === "admin"
  const allUsersRaw = useModerationStore((s) => s.allUsers)
  const users = allUsersRaw.filter((u) => u.id !== currentUser?.id)
  const sanctions = useModerationStore((s) => s.sanctions)
  const setSanction = useModerationStore((s) => s.setSanction)
  const addUser = useModerationStore((s) => s.addUser)
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const validUsers = users.filter((u) => !!u.id)
  const loadMore = useModerationStore((s) => s.loadMoreUsers)
  const allUsersPage = useModerationStore((s) => s.allUsersPage)
  const allUsersLimit = useModerationStore((s) => s.allUsersLimit)
  const allUsersTotal = useModerationStore((s) => s.allUsersTotal)
  // Compare raw (unfiltered) count against backend total to avoid off-by-one with currentUser exclusion
  const hasMore = allUsersRaw.length < allUsersTotal

  const sentinelRef = useRef<HTMLDivElement | null>(null)

  function runAction(id: string, fn: () => Promise<void>, patch: { isBanned?: boolean }) {
    setActionId(id)
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        setSanction(id, patch)
      } catch {
        setError(t("actionFailed"))
      } finally {
        setActionId(null)
      }
    })
  }

  function getVisible(filter: Filter) {
    return validUsers.filter((u) => {
      const s = sanctions[u.id] ?? { isBanned: u.isBanned }
      if (filter === "banned") return s.isBanned
      return true
    })
  }

  const bannedCount = validUsers.filter(
    (u) => (sanctions[u.id] ?? { isBanned: u.isBanned }).isBanned
  ).length

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return
    const nextPage = allUsersPage + 1
    setIsLoadingMore(true)
    startTransition(async () => {
      try {
        const res = await listAllUsers(nextPage, allUsersLimit)
        loadMore(res.users, res.total, res.page)
      } catch {
        setError(t("actionFailed"))
      } finally {
        setIsLoadingMore(false)
      }
    })
  }, [isLoadingMore, hasMore, allUsersPage, allUsersLimit, loadMore])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) handleLoadMore()
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleLoadMore])

  return (
    <div>
      {error && (
        <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
          <IconAlertTriangle size={16} />
          {error}
        </div>
      )}

      <Tabs defaultValue='all'>
        <div className='mb-4 flex items-center justify-between'>
          <TabsList variant='line'>
            <TabsTrigger value='all'>{t("allCount", { count: validUsers.length })}</TabsTrigger>
            <TabsTrigger value='banned'>{t("bannedCount", { count: bannedCount })}</TabsTrigger>
          </TabsList>

          {isAdmin && (
            <Button size='sm' onClick={() => setDialogOpen(true)}>
              <IconUserPlus size={15} />
              {t("addUser")}
            </Button>
          )}
        </div>

        {(["all", "banned"] as Filter[]).map((filter) => {
          const visible = getVisible(filter)
          return (
            <TabsContent key={filter} value={filter}>
              {visible.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                  <IconUsers size={40} className='mb-3 opacity-40' />
                  <p className='text-sm'>{t("noUsers")}</p>
                </div>
              ) : (
                <ul className='space-y-3'>
                  {visible.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      sanction={sanctions[user.id] ?? { isBanned: user.isBanned }}
                      isAdmin={isAdmin}
                      isPending={isPending}
                      actionId={actionId}
                      runAction={runAction}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          )
        })}

        {hasMore && (
          <div
            ref={sentinelRef}
            className='mt-4 flex justify-center py-2 text-sm text-muted-foreground'
          >
            {isLoadingMore ? t("loading") : ""}
          </div>
        )}
      </Tabs>

      {isAdmin && (
        <AddUserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={(user) => {
            addUser(user)
            setDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}
