import { IconUserOff, IconBan } from "@tabler/icons-react"

interface Props {
  isSuspended: boolean
  isBanned: boolean
}

export function SanctionBadge({ isSuspended, isBanned }: Props) {
  if (isBanned) {
    return (
      <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'>
        <IconBan size={11} />
        Banned
      </span>
    )
  }
  if (isSuspended) {
    return (
      <span className='inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
        <IconUserOff size={11} />
        Suspended
      </span>
    )
  }
  return null
}
