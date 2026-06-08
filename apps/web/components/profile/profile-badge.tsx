import { cn } from "@/lib/utils"
import { ModeratorBadge } from "@/components/badges/moderator-badge"
import { AdminBadge } from "@/components/badges/admin-badge"

export type UserRole = "user" | "moderator" | "admin"

interface ProfileBadgesProps {
  role: UserRole
  className?: string
}

export function ProfileBadges({ role, className }: ProfileBadgesProps) {
  if (role === "user") {
    return null
  }

  if (role === "moderator") {
    return <ModeratorBadge className={className} />
  }

  return (
    <div className='flex items-center'>
      {/* Badge admin (arrière-plan) */}
      <div className='z-20'>
        <AdminBadge className={cn("size-6", className)} />
      </div>
      {/* Badge modérateur (avant-plan, chevauchement) */}
      <div className='z-10 -ml-3'>
        <ModeratorBadge className={cn("size-6", className)} />
      </div>
    </div>
  )
}
