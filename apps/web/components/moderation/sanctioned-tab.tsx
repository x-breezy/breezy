"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  IconCheck,
  IconUserOff,
  IconBan,
  IconAlertTriangle,
  IconExternalLink,
  IconLockOpen,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { unsuspendUser, banUser, unbanUser } from "@/lib/actions/users"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"
import type { SanctionedUser } from "@/lib/actions/users"

type Filter = "all" | "suspended" | "banned"

export function SanctionedTab() {
  const isAdmin = useUserStore((s) => s.user?.role) === "admin"
  const users = useModerationStore((s) => s.sanctionedUsers)
  const sanctions = useModerationStore((s) => s.sanctions)
  const setSanction = useModerationStore((s) => s.setSanction)
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function runAction(
    id: string,
    fn: () => Promise<void>,
    patch: { isSuspended?: boolean; isBanned?: boolean }
  ) {
    setActionId(id)
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        setSanction(id, patch)
      } catch {
        setError("Action failed. Please try again.")
      } finally {
        setActionId(null)
      }
    })
  }

  function getVisible(filter: Filter) {
    return users.filter((u) => {
      const s = sanctions[u.id] ?? { isSuspended: u.isSuspended, isBanned: u.isBanned }
      if (filter === "suspended") return s.isSuspended && !s.isBanned
      if (filter === "banned") return s.isBanned
      return true
    })
  }

  return (
    <div>
      {error && (
        <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
          <IconAlertTriangle size={16} />
          {error}
        </div>
      )}

      <Tabs defaultValue='all'>
        <TabsList variant='line' className='mb-4'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='suspended'>Suspended</TabsTrigger>
          <TabsTrigger value='banned'>Banned</TabsTrigger>
        </TabsList>

        {(["all", "suspended", "banned"] as Filter[]).map((filter) => {
          const visible = getVisible(filter)
          return (
            <TabsContent key={filter} value={filter}>
              {visible.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                  <IconCheck size={40} className='mb-3 opacity-40' />
                  <p className='text-sm'>No sanctioned users found.</p>
                </div>
              ) : (
                <ul className='space-y-3'>
                  {visible.map((user) => (
                    <SanctionedUserCard
                      key={user.id}
                      user={user}
                      sanction={
                        sanctions[user.id] ?? {
                          isSuspended: user.isSuspended,
                          isBanned: user.isBanned,
                        }
                      }
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
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SanctionedUserCard
// ---------------------------------------------------------------------------

interface SanctionedUserCardProps {
  user: SanctionedUser
  sanction: { isSuspended: boolean; isBanned: boolean }
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  runAction: (
    id: string,
    fn: () => Promise<void>,
    patch: { isSuspended?: boolean; isBanned?: boolean }
  ) => void
}

function SanctionedUserCard({
  user,
  sanction,
  isAdmin,
  isPending,
  actionId,
  runAction,
}: SanctionedUserCardProps) {
  const loading = isPending && actionId === user.id
  const initials = user.username.slice(0, 2).toUpperCase()

  return (
    <li className='flex items-center gap-3 rounded-xl border bg-card p-4'>
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className='min-w-0 flex-1'>
        <div className='mb-0.5 flex flex-wrap items-center gap-2'>
          <Link
            href={`/profile/${user.username}`}
            className='inline-flex items-center gap-1 font-semibold hover:underline'
          >
            @{user.username}
            <IconExternalLink size={12} />
          </Link>
          {sanction.isBanned && (
            <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              <IconBan size={11} />
              Banned
            </span>
          )}
          {sanction.isSuspended && !sanction.isBanned && (
            <span className='inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
              <IconUserOff size={11} />
              Suspended
            </span>
          )}
          <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
            {user.role}
          </span>
        </div>
        <p className='text-xs text-muted-foreground'>{user.email}</p>
      </div>

      <div className='flex shrink-0 flex-wrap items-center gap-2'>
        {sanction.isSuspended && (
          <Button
            variant='outline'
            size='xs'
            onClick={() => runAction(user.id, () => unsuspendUser(user.id), { isSuspended: false })}
            disabled={loading}
            className='border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
          >
            <IconLockOpen />
            {loading ? "…" : "Unsuspend"}
          </Button>
        )}
        {isAdmin && sanction.isBanned && (
          <Button
            variant='outline'
            size='xs'
            onClick={() => runAction(user.id, () => unbanUser(user.id), { isBanned: false })}
            disabled={loading}
            className='border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
          >
            <IconLockOpen />
            {loading ? "…" : "Unban"}
          </Button>
        )}
        {isAdmin && !sanction.isBanned && (
          <Button
            variant='destructive'
            size='xs'
            onClick={() => runAction(user.id, () => banUser(user.id), { isBanned: true })}
            disabled={loading}
          >
            <IconBan />
            {loading ? "…" : "Ban"}
          </Button>
        )}
      </div>
    </li>
  )
}
