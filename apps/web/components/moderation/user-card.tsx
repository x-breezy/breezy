import { SanctionedUser, unbanUser, banUser } from "@/lib/actions/users"
import { IconExternalLink, IconBan, IconLockOpen } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { ProfileAvatar } from "../profile"
import { Button } from "../ui/button"

interface UserCardProps {
  user: SanctionedUser
  sanction: { isBanned: boolean }
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  runAction: (id: string, fn: () => Promise<void>, patch: { isBanned?: boolean }) => void
}

export default function UserCard({
  user,
  sanction,
  isAdmin,
  isPending,
  actionId,
  runAction,
}: UserCardProps) {
  const t = useTranslations("moderationPage")
  const loading = isPending && actionId === user.id

  return (
    <li className='flex items-center gap-3 rounded-xl py-2'>
      <ProfileAvatar size='2xs' src={user.avatarUrl ?? undefined} />

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
              {t("bannedBadge")}
            </span>
          )}
          <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
            {user.role}
          </span>
        </div>
        <p className='text-xs text-muted-foreground'>{user.email}</p>
      </div>

      <div className='flex shrink-0 flex-wrap items-center gap-2'>
        {isAdmin && sanction.isBanned && (
          <Button
            variant='outline'
            size='xs'
            onClick={() => runAction(user.id, () => unbanUser(user.id), { isBanned: false })}
            disabled={loading}
            className='border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
          >
            <IconLockOpen />
            {loading ? "…" : t("unban")}
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
            {loading ? "…" : t("ban")}
          </Button>
        )}
      </div>
    </li>
  )
}
