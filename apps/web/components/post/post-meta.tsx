import Link from "next/link"
import { UserRole } from "@/lib/auth/role"
import { UsernameDisplay } from "@/components/shared/username-display"

interface PostMetaProps {
  name: string
  username: string
  role?: UserRole
  createdAt?: string
  compact?: boolean
}

export function PostMeta({ name, username, role, createdAt, compact }: PostMetaProps) {
  if (compact) {
    return (
      <Link
        href={`/profile/${username}`}
        className='flex min-w-0 items-center gap-1.5'
        onClick={(e) => e.stopPropagation()}
      >
        <UsernameDisplay
          name={name}
          role={role}
          nameClassName='truncate text-sm hover:underline'
          badgeClassName='size-4'
        />
        <span className='min-w-0 truncate text-xs text-muted-foreground'>@{username}</span>
        {createdAt && (
          <>
            <span className='shrink-0 text-xs text-muted-foreground' aria-hidden='true'>
              &middot;
            </span>
            <span className='shrink-0 text-xs text-muted-foreground'>{createdAt}</span>
          </>
        )}
      </Link>
    )
  }

  return (
    <Link
      href={`/profile/${username}`}
      className='flex min-w-0 flex-col'
      onClick={(e) => e.stopPropagation()}
    >
      <UsernameDisplay name={name} role={role} nameClassName='truncate text-sm hover:underline' />
      <p className='flex items-center gap-1.5 truncate text-xs text-muted-foreground'>
        @{username}
      </p>
    </Link>
  )
}
