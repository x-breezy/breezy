import { cn } from "@/lib/utils"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { buildPostTokens } from "@/lib/post-utils"

interface ProfileBioProps {
  children: string | null
  className?: string
}

export function ProfileBio({ children, className }: ProfileBioProps) {
  const t = useTranslations("profilePage")
  return (
    <section className={cn("space-y-2", className)}>
      <h2 className='text-lg font-semibold'>{t("biographyTitle")}</h2>
      {children && (
        <p className='leading-relaxed whitespace-pre-wrap'>
          {buildPostTokens(children).map((token, i) => {
            if (token.type === "text") return token.value
            if (token.type === "mention")
              return (
                <Link key={i} href={`/profile/${token.value.slice(1)}`} className={token.className}>
                  {token.value}
                </Link>
              )
            if (token.type === "link")
              return (
                <a
                  key={i}
                  href={token.value}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={token.className}
                >
                  {token.value}
                </a>
              )
            return (
              <Link
                key={i}
                href={`/search?q=${encodeURIComponent(token.value)}`}
                className={token.className}
              >
                {token.value}
              </Link>
            )
          })}
        </p>
      )}
    </section>
  )
}
