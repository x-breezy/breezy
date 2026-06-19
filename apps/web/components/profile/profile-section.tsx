import { ProfileAvatar } from "./profile-avatar"
import { ProfileInfo } from "./profile-info"
import { ProfileStats } from "./profile-stats"
import { ProfileActions } from "./profile-actions"
import { ProfileBio } from "./profile-bio"
import { cn } from "@/lib/utils"
import { Profile } from "@/types/profile"
import { UserRole } from "@/lib/auth/role"

interface ProfileSectionProps {
  profile: Profile
  role?: UserRole
  className?: string
  isOwn?: boolean
}

export function ProfileSection({ className, profile, role, isOwn }: ProfileSectionProps) {
  return (
    <section className={cn("md:px-4 md:py-6", className)}>
      {/* Mobile Layout */}
      <div className='flex flex-col items-center gap-4 p-4 md:hidden'>
        <ProfileAvatar src={profile.avatarId || undefined} alt={profile.username} size='xl' />
        <ProfileInfo
          name={[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || profile?.username}
          username={profile?.username}
          userId={profile.profileId}
          role={role || UserRole.User}
          isOwn={isOwn}
        />
        <ProfileStats
          profileId={profile.profileId}
          followers={profile.followersCount}
          following={profile.followingCount}
        />
        <ProfileActions profile={profile} isOwn={isOwn} className='justify-center' />
        <ProfileBio className='mt-2 w-full'>{profile.bio}</ProfileBio>
      </div>

      {/* Desktop Layout */}
      <div className='container-center hidden md:mx-auto md:flex md:items-start md:justify-center md:gap-8'>
        <ProfileAvatar src={profile.avatarId || undefined} alt={profile.username} size='2xl' />

        <div className='flex flex-1 flex-col gap-4'>
          <div className='flex items-start justify-between'>
            <div className='flex flex-col gap-2'>
              <ProfileInfo
                name={[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || profile?.username}
                username={profile?.username}
                userId={profile.profileId}
                role={role}
                className='items-start'
                isOwn={isOwn}
              />
              <ProfileStats
                profileId={profile.profileId}
                followers={profile.followersCount}
                following={profile.followingCount}
              />
            </div>
          </div>
          <ProfileBio>{profile.bio}</ProfileBio>
        </div>
      </div>
      <div className='container-center mx-auto mt-4 hidden md:flex'>
        <ProfileActions profile={profile} isOwn={isOwn} />
      </div>
    </section>
  )
}
