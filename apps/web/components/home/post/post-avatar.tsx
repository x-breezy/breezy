interface PostAvatarProps {
  name: string
}

export function PostAvatar({ name }: PostAvatarProps) {
  const initial = name.charAt(0) || "?"
  return (
    <div
      aria-label={`${name}'s avatar`}
      className='flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground uppercase'
    >
      {initial}
    </div>
  )
}
