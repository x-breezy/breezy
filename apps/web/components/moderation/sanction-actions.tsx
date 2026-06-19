"use client"

import { IconUserOff, IconBan, IconLockOpen } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { suspendUser, unsuspendUser, banUser, unbanUser } from "@/lib/actions/users"

export interface SanctionState {
  isSuspended: boolean
  isBanned: boolean
}

export type RunSanction = (
  id: string,
  userId: string,
  fn: () => Promise<void>,
  patch: { isSuspended?: boolean; isBanned?: boolean }
) => void

interface Props {
  userId: string
  sanction: SanctionState
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  runSanction: RunSanction
}

export function SanctionActions({ userId, sanction, isAdmin, isPending, actionId, runSanction }: Props) {
  const loading = isPending && actionId === userId

  return (
    <>
      {sanction.isSuspended && (
        <Button
          variant='outline'
          size='xs'
          onClick={() => runSanction(userId, userId, () => unsuspendUser(userId), { isSuspended: false })}
          disabled={loading}
          className='border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
        >
          <IconLockOpen />
          {loading ? "…" : "Unsuspend"}
        </Button>
      )}
      {!sanction.isSuspended && !sanction.isBanned && (
        <Button
          variant='outline'
          size='xs'
          onClick={() => runSanction(userId, userId, () => suspendUser(userId), { isSuspended: true })}
          disabled={loading}
          className='border-orange-300 text-orange-700 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20'
        >
          <IconUserOff />
          {loading ? "…" : "Suspend"}
        </Button>
      )}
      {isAdmin && sanction.isBanned && (
        <Button
          variant='outline'
          size='xs'
          onClick={() => runSanction(userId, userId, () => unbanUser(userId), { isBanned: false })}
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
          onClick={() => runSanction(userId, userId, () => banUser(userId), { isBanned: true })}
          disabled={loading}
        >
          <IconBan />
          {loading ? "…" : "Ban"}
        </Button>
      )}
    </>
  )
}
