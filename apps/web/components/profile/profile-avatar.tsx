import { Avatar, AvatarFallback, AvatarImage } from "@breezy/ui/components/avatar"
import { cn } from "@breezy/ui/lib/utils"

interface ProfileAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl" | "2xl"
  className?: string
}

const sizeClasses = {
  sm: "size-20",
  md: "size-24",
  lg: "size-28",
  xl: "size-32",
  "2xl": "size-40",
}

export function ProfileAvatar({
  src,
  alt = "Profile",
  fallback,
  size = "lg",
  className,
}: ProfileAvatarProps) {
  return (
    <Avatar className={cn("border-2", sizeClasses[size], className)}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback className='bg-muted text-lg'>
        {fallback || alt.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  )
}
