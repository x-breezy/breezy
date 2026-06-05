import { cn } from "@breezy/ui/lib/utils"
import { ModeratorBadge } from "@/components/badges/moderateur-badge"
import { AdminBadge } from "@/components/badges/admin-badge"

export type UserRole = "user" | "moderator" | "admin"

interface ProfileBadgesProps {
  role: UserRole
  className?: string
}

export function ProfileBadges({ role, className }: ProfileBadgesProps) {
  // User: aucun badge
  if (role === "user") {
    return null
  }

  // Moderator: uniquement le badge modérateur
  if (role === "moderator") {
    return <ModeratorBadge className={className} />
  }

  // Admin: les deux badges collés avec chevauchement
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
