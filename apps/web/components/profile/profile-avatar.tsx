import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { IconUserFilled } from "@tabler/icons-react"

interface ProfileAvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "2xs"
  className?: string
}

const sizeClasses = {
  "2xs": "size-11",
  xs: "size-16",
  sm: "size-20",
  md: "size-24",
  lg: "size-28",
  xl: "size-32",
  "2xl": "size-40",
}

const iconSizeClasses = {
  "2xs": "size-5",
  xs: "size-8",
  sm: "size-10",
  md: "size-12",
  lg: "size-14",
  xl: "size-16",
  "2xl": "size-20",
}

export function ProfileAvatar({
  src,
  alt = "Profile",
  size = "lg",
  className,
}: ProfileAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback className='text-lg'>
        <IconUserFilled className={cn(iconSizeClasses[size])} />
      </AvatarFallback>
    </Avatar>
  )
}
