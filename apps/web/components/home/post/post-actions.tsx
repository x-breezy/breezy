import { LikeButton } from "./like-button"
import { CommentButton } from "./comment-button"

interface PostActionsProps {
  likes: number
  comments: number
  isLiked: boolean
  onLike: (e: React.MouseEvent) => void
}

export function PostActions({ likes, comments, isLiked, onLike }: PostActionsProps) {
  return (
    <div className='mt-2 flex items-center gap-6 text-muted-foreground'>
      <LikeButton count={likes} isLiked={isLiked} onLike={onLike} />
      <CommentButton count={comments} />
    </div>
  )
}
