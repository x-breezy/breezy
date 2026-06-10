import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { IconUserFilled } from "@tabler/icons-react"

interface ProfileIconProps {
  active?: boolean
  src?: string
  alt?: string
  className?: string
}

export function ProfileIcon({
  active = false,
  src = "/test/pp_test.png",
  alt = "Profile",
  className,
}: ProfileIconProps) {
  return (
    <Avatar
      className={cn(
        "h-full w-full",
        className,
        active && "ring-2 ring-foreground ring-offset-1 ring-offset-background"
      )}
    >
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>
        <IconUserFilled />
      </AvatarFallback>
    </Avatar>
  )
}
