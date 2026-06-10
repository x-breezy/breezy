import { cn } from "@/lib/utils"
import { ModeratorBadge } from "@/components/badges/moderator-badge"
import { AdminBadge } from "@/components/badges/admin-badge"
import { UserRole } from "@/lib/auth/role"

interface ProfileBadgesProps {
  role: UserRole
  className?: string
}

export function ProfileBadges({ role, className }: ProfileBadgesProps) {
  if (role === UserRole.User) {
    return null
  }

  if (role === UserRole.Moderator) {
    return <ModeratorBadge className={className} />
  }

  return (
    <div className='flex items-center'>
      <div className='z-20'>
        <AdminBadge className={cn("size-6", className)} />
      </div>
      <div className='z-10 -ml-3'>
        <ModeratorBadge className={cn("size-6", className)} />
      </div>
    </div>
  )
}
