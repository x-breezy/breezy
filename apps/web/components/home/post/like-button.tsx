import { IconHeart } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  count: number
  isLiked: boolean
  onLike: (e: React.MouseEvent) => void
}

export function LikeButton({ count, isLiked, onLike }: LikeButtonProps) {
  return (
    <button
      onClick={onLike}
      aria-label={isLiked ? "Unlike post" : "Like post"}
      aria-pressed={isLiked}
      className={cn(
        "flex items-center gap-1 text-xs transition select-none",
        isLiked ? "font-medium text-red-500" : "text-muted-foreground active:text-red-500"
      )}
    >
      <IconHeart
        size={18}
        stroke={2}
        className='shrink-0'
        fill={isLiked ? "currentColor" : "none"}
        aria-hidden='true'
      />
      <span aria-label={`${count} likes`}>{count}</span>
    </button>
  )
}
