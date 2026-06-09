import { cn } from "@/lib/utils"
import { ProfileBadges, type UserRole } from "./profile-badge"

interface ProfileInfoProps {
  name: string
  username: string
  role?: UserRole
  className?: string
}

export function ProfileInfo({ name, username, role = "user", className }: ProfileInfoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className='flex items-center gap-2'>
        <h1 className='text-2xl font-bold'>{name}</h1>
        <ProfileBadges role={role} />
      </div>
      <p className='text-muted-foreground'>@{username}</p>
    </div>
  )
}
