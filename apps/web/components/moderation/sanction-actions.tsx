"use client"

import { IconBan, IconLockOpen } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { banUser, unbanUser } from "@/lib/actions/users"

export interface SanctionState {
  isBanned: boolean
}

export type RunSanction = (
  id: string,
  userId: string,
  fn: () => Promise<void>,
  patch: { isBanned?: boolean }
) => void

interface Props {
  userId: string
  sanction: SanctionState
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  runSanction: RunSanction
}

export function SanctionActions({
  userId,
  sanction,
  isAdmin,
  isPending,
  actionId,
  runSanction,
}: Props) {
  const loading = isPending && actionId === userId

  return (
    <>
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
