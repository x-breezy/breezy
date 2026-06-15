interface PostMetaProps {
  name: string
  username: string
  createdAt: string
}

export function PostMeta({ name, username, createdAt }: PostMetaProps) {
  return (
    <div className='flex min-w-0 items-center gap-1 text-sm'>
      <span className='truncate font-bold text-foreground'>{name}</span>
      <span className='truncate text-xs text-muted-foreground'>@{username}</span>
      <span className='text-xs text-muted-foreground'>·</span>
      <span className='shrink-0 text-xs text-muted-foreground'>{createdAt}</span>
    </div>
  )
}
