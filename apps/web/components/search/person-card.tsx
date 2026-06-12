import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export interface PersonCardProps {
  id: string
  displayName: string | null
  username: string
  avatarUrl: string | null
  onClick: () => void
}

export function PersonCard({ displayName, username, avatarUrl, onClick }: PersonCardProps) {
  const initials = (displayName ?? username ?? "?")[0]?.toUpperCase()
  return (
    <li
      onClick={onClick}
      className='flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50'
    >
      <Avatar>
        <AvatarImage src={avatarUrl ?? undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className='flex flex-col'>
        {displayName && <span className='text-sm font-medium'>{displayName}</span>}
        {username && <span className='text-sm text-muted-foreground'>@{username}</span>}
      </div>
    </li>
  )
}
