import { LikeButton } from "./buttons/like-button"
import { CommentButton } from "./buttons/comment-button"
import { ShareButton } from "./buttons/share-button"

interface PostActionsProps {
  likes: number
  comments: number
  isLiked: boolean
  onLike: (e: React.MouseEvent) => void
  onComment: (e: React.MouseEvent) => void
  onShare: (e: React.MouseEvent) => void
  size?: "sm" | "md"
}

const gapClasses = { sm: "gap-0", md: "gap-2" }

export function PostActions({
  likes,
  comments,
  isLiked,
  onLike,
  onComment,
  onShare,
  size = "sm",
}: PostActionsProps) {
  return (
    <div className={`mt-2 flex items-center ${gapClasses[size]} text-muted-foreground`}>
      <LikeButton count={likes} isLiked={isLiked} onLike={onLike} size={size} />
      <CommentButton count={comments} onComment={onComment} size={size} />
      <ShareButton onShare={onShare} size={size} />
    </div>
  )
}
