import { cn } from "@/lib/utils"
import { UserRole } from "@/lib/auth/role"
import { ProfileBadges } from "../profile/profile-badge"

interface UsernameDisplayProps {
  name: string
  role?: UserRole
  className?: string
  nameClassName?: string
  badgeClassName?: string
}

export function UsernameDisplay({
  name,
  role = UserRole.User,
  className,
  nameClassName,
  badgeClassName,
}: UsernameDisplayProps) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <span className={cn("font-semibold", nameClassName)}>{name}</span>
      <ProfileBadges role={role} className={badgeClassName} />
    </span>
  )
}
