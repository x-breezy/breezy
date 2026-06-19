import { IconMessageCircle } from "@tabler/icons-react"

interface CommentButtonProps {
  count: number
  onComment: (e: React.MouseEvent) => void
  size?: "sm" | "md"
}

const sizeConfig = { sm: 18, md: 22 }

export function CommentButton({ count, onComment, size = "sm" }: CommentButtonProps) {
  const iconSize = sizeConfig[size]
  return (
    <button
      aria-label={`${count} comments. Reply to this post.`}
      className={`flex items-center gap-1 ${size === "md" ? "text-sm" : "text-xs"} rounded-full p-1 px-2 text-muted-foreground transition select-none hover:bg-blue-500/10 hover:text-blue-500 active:text-blue-500`}
      onClick={onComment}
    >
      <IconMessageCircle size={iconSize} stroke={2} className='shrink-0' aria-hidden='true' />
      <span aria-label={`${count} comments`}>{count}</span>
    </button>
  )
}
