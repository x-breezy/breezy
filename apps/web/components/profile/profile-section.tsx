import { ProfileAvatar } from "./profile-avatar"
import { ProfileInfo } from "./profile-info"
import { ProfileStats } from "./profile-stats"
import { ProfileActions } from "./profile-actions"
import { ProfileBio } from "./profile-bio"
import { cn } from "@breezy/ui/lib/utils"
import type { UserRole } from "./profile-badge"

interface ProfileSectionProps {
  avatar: string
  name: string
  username: string
  role: UserRole
  followers: number
  following: number
  bio: React.ReactNode
  className?: string
}

export function ProfileSection({
  avatar,
  name,
  username,
  role,
  followers,
  following,
  bio,
  className,
}: ProfileSectionProps) {
  return (
    <section className={cn("", className)}>
      {/* Mobile Layout */}
      <div className='flex flex-col items-center gap-4 p-4 md:hidden'>
        <ProfileAvatar src={avatar} alt={name} size='xl' />
        <ProfileInfo name={name} username={username} role={role} />
        <ProfileStats followers={followers} following={following} />
        <ProfileActions />
        <ProfileBio className='mt-2 w-full'>{bio}</ProfileBio>
      </div>

      {/* Desktop Layout */}
      <div className='hidden max-w-4xl md:mx-auto md:flex md:items-start md:justify-center md:gap-8'>
        <div className='flex flex-col items-center gap-4'>
          <ProfileAvatar src={avatar} alt={name} size='2xl' />
          <ProfileActions />
        </div>

        <div className='flex flex-1 flex-col gap-4'>
          <div className='flex items-start justify-between'>
            <div className='flex flex-col gap-1'>
              <ProfileInfo name={name} username={username} role={role} className='items-start' />
              <ProfileStats followers={followers} following={following} />
            </div>
          </div>
          <ProfileBio>{bio}</ProfileBio>
        </div>
      </div>
    </section>
  )
}
