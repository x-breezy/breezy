import Link from "next/link"
import { buildPostTokens } from "@/lib/post-utils"

interface PostContentProps {
  content: string
}

export function PostContent({ content }: PostContentProps) {
  return (
    <p className='text-sm leading-tight wrap-break-word whitespace-pre-wrap text-foreground'>
      {buildPostTokens(content).map((token, i) => {
        if (token.type === "text") return token.value
        if (token.type === "mention")
          return (
            <Link
              key={i}
              href={`/profile/${token.value.slice(1)}`}
              className={token.className}
              onClick={(e) => e.stopPropagation()}
            >
              {token.value}
            </Link>
          )
        return (
          <Link
            key={i}
            href={`/search?q=${encodeURIComponent(token.value)}`}
            className={token.className}
            onClick={(e) => e.stopPropagation()}
          >
            {token.value}
          </Link>
        )
      })}
    </p>
  )
}
