import Link from "next/link"

interface PostMetaProps {
  name: string
  username: string
  createdAt: string
}

export function PostMeta({ name, username, createdAt }: PostMetaProps) {
  return (
    <Link
      href={`/profile/${username}`}
      className='flex min-w-0 items-center gap-2'
      onClick={(e) => e.stopPropagation()}
    >
      <p className='truncate text-sm font-semibold'>{name}</p>
      <p className='truncate text-xs text-muted-foreground'>
        @{username} · {createdAt}
      </p>
    </Link>
  )
}
