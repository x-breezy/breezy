import Link from "next/link"

interface PostMetaProps {
  name: string
  username: string
  createdAt?: string
  compact?: boolean
}

export function PostMeta({ name, username, createdAt, compact }: PostMetaProps) {
  if (compact) {
    return (
      <Link
        href={`/profile/${username}`}
        className='flex min-w-0 items-baseline gap-1.5 truncate'
        onClick={(e) => e.stopPropagation()}
      >
        <span className='truncate text-sm font-semibold hover:underline'>{name}</span>
        <span className='shrink-0 truncate text-xs text-muted-foreground'>@{username}</span>
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
      <p className='truncate text-sm font-semibold hover:underline'>{name}</p>
      <p className='flex items-center gap-1.5 truncate text-xs text-muted-foreground'>
        @{username}
      </p>
    </Link>
  )
}
