import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("profilePage")
  return (
    <section className={cn("space-y-2", className)}>
      <h2 className='text-lg font-semibold'>{t("biographyTitle")}</h2>
      <p className='leading-relaxed text-muted-foreground'>{children}</p>
    </section>
  )
}

export { BioMention }
