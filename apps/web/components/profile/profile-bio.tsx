import { cn } from "@breezy/ui/lib/utils"
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
  title?: string
  children: React.ReactNode
  className?: string
}

export function ProfileBio({ title = "Biography", children, className }: ProfileBioProps) {
  return (
    <section className={cn("space-y-2", className)}>
      <h2 className='text-lg font-semibold'>{title}</h2>
      <p className='leading-relaxed text-muted-foreground'>{children}</p>
    </section>
  )
}

export { BioMention }
