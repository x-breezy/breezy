import { cn } from "@/lib/utils"

interface ProfileStatProps {
  count: number
  label: string
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`
  }
  return count.toString()
}

function ProfileStat({ count, label }: ProfileStatProps) {
  return (
    <div className='flex items-baseline gap-1'>
      <span className='font-semibold'>{formatCount(count)}</span>
      <span className='text-sm text-muted-foreground'>{label}</span>
    </div>
  )
}

interface ProfileStatsProps {
  followers: number
  following: number
  className?: string
}

export function ProfileStats({ followers, following, className }: ProfileStatsProps) {
  return (
    <div className={cn("flex items-center gap-6", className)}>
      <ProfileStat count={followers} label='followers' />
      <ProfileStat count={following} label='following' />
    </div>
  )
}
