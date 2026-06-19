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
import { unsuspendUser, banUser, unbanUser } from "@/lib/actions/users"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"

const FILTER_OPTIONS = [
  { label: "All", value: "all" as const },
  { label: "Suspended", value: "suspended" as const },
  { label: "Banned", value: "banned" as const },
]

export function SanctionedTab() {
  const isAdmin = useUserStore((s) => s.user?.role) === "admin"
  const users = useModerationStore((s) => s.sanctionedUsers)
  const sanctions = useModerationStore((s) => s.sanctions)
  const setSanction = useModerationStore((s) => s.setSanction)
  const [filter, setFilter] = useState<"all" | "suspended" | "banned">("all")
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const visible = users.filter((u) => {
    const s = sanctions[u.id] ?? { isSuspended: u.isSuspended, isBanned: u.isBanned }
    if (filter === "suspended") return s.isSuspended && !s.isBanned
    if (filter === "banned") return s.isBanned
    return true
  })

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

  return (
    <div>
      {/* Sub-filter */}
      <div className='mb-4 flex gap-2 border-b'>
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`pb-2 text-sm font-medium transition-colors ${
              filter === opt.value
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
          <IconAlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Empty */}
      {visible.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
          <IconCheck size={40} className='mb-3 opacity-40' />
          <p className='text-sm'>No sanctioned users found.</p>
        </div>
      )}

      {/* List */}
      <ul className='space-y-3'>
        {visible.map((user) => {
          const s = sanctions[user.id] ?? { isSuspended: user.isSuspended, isBanned: user.isBanned }
          return (
            <li
              key={user.id}
              className='flex items-center justify-between gap-4 rounded-lg border p-4'
            >
              <div className='min-w-0 flex-1'>
                <div className='mb-1 flex flex-wrap items-center gap-2'>
                  {s.isSuspended && !s.isBanned && (
                    <span className='inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
                      <IconUserOff size={12} />
                      Suspended
                    </span>
                  )}
                  {s.isBanned && (
                    <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'>
                      <IconBan size={12} />
                      Banned
                    </span>
                  )}
                  <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
                    {user.role}
                  </span>
                </div>
                <Link
                  href={`/profile/${user.username}`}
                  className='inline-flex items-center gap-1 text-sm font-medium hover:underline'
                >
                  @{user.username}
                  <IconExternalLink size={12} />
                </Link>
                <p className='text-xs text-muted-foreground'>{user.email}</p>
              </div>

              <div className='flex shrink-0 flex-col items-end gap-2'>
                {s.isSuspended && !s.isBanned && (
                  <button
                    onClick={() =>
                      runAction(user.id, () => unsuspendUser(user.id), { isSuspended: false })
                    }
                    disabled={isPending && actionId === user.id}
                    className='inline-flex items-center gap-1 rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                  >
                    <IconLockOpen size={12} />
                    Unsuspend
                  </button>
                )}
                {isAdmin && s.isBanned && (
                  <button
                    onClick={() =>
                      runAction(user.id, () => unbanUser(user.id), { isBanned: false })
                    }
                    disabled={isPending && actionId === user.id}
                    className='inline-flex items-center gap-1 rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                  >
                    <IconLockOpen size={12} />
                    Unban
                  </button>
                )}
                {isAdmin && !s.isBanned && (
                  <button
                    onClick={() => runAction(user.id, () => banUser(user.id), { isBanned: true })}
                    disabled={isPending && actionId === user.id}
                    className='inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50'
                  >
                    <IconBan size={12} />
                    Ban
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
