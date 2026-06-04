import { Avatar, AvatarImage } from "@breezy/ui/components/avatar"

interface ProfileIconProps {
  active?: boolean
  src?: string
  alt?: string
  className?: string
}

export function ProfileIcon({
  active = false,
  src = "/navbar/pp_test.png",
  alt = "Profile",
  className,
}: ProfileIconProps) {
  return (
    <Avatar
      size='sm'
      className={active ? "ring-2 ring-foreground ring-offset-1 ring-offset-background" : ""}
    >
      <AvatarImage src={src} alt={alt} className={className} />
    </Avatar>
  )
}
