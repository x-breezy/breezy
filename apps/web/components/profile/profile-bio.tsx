import { cn } from "@/lib/utils"
import Link from "next/link"

interface BioMentionProps {
  username: string
}

function BioMention({ username }: BioMentionProps) {
  return (
    <Link href={`/${username}`} className='text-primary hover:underline'>
      @{username}
    </Link>
  )
}

interface ProfileBioProps {
  children: React.ReactNode
  className?: string
}

export function ProfileBio({ children, className }: ProfileBioProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <p className='leading-relaxed'>{children}</p>
    </section>
  )
}

export { BioMention }
