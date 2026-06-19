import { cn } from "@/lib/utils"
import { ModeratorBadge } from "@/components/shared/badges/moderator-badge"
import { AdminBadge } from "@/components/shared/badges/admin-badge"
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
    <span className='inline-flex items-center'>
      <span className='z-20'>
        <AdminBadge className={cn("size-6", className)} />
      </span>
      <span className='z-10 -ml-3'>
        <ModeratorBadge className={cn("size-6", className)} />
      </span>
    </span>
  )
}
