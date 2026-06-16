"use client"

import { memo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PostMeta, PostContent, PostActions } from "."
import { PostMenu } from "./post-menu"
import { ProfileAvatar } from "../profile"
import { ReplyComposeDialog } from "./create-post/ReplyComposeDialog"
import type { SearchPostMedia } from "@/lib/actions/posts"
import { MediaViewer } from "../shared/medias/media-viewer"
import { AutoplayVideo } from "../shared/medias/autoplay-video"
import { MediaImage } from "../shared/medias/media-image"
import { mediaUrl, timeAgo, formatFullDate, cn } from "@/lib/utils"

interface HomePostProps {
  id: string
  name: string
  username: string
  avatarUrl?: string
  content: string
  media?: SearchPostMedia[]
  createdAt: string
  initialLikes?: number
  initialComments?: number
  initialLiked?: boolean
  href?: string
  onLike?: (postId: string, newLiked: boolean) => Promise<number | void>
  onReplyCreated?: () => void
  authorId?: string
  compact?: boolean
  showAvatar?: boolean
  className?: string
}

function Post({
  id,
  name,
  username,
  avatarUrl,
  content,
  media,
  createdAt,
  initialLikes = 0,
  initialComments = 0,
  initialLiked = false,
  href,
  onLike,
  onReplyCreated,
  authorId,
  compact = true,
  showAvatar = true,
  className,
}: HomePostProps) {
  const router = useRouter()
  const [likes, setLikes] = useState(initialLikes)
  const [comments, setComments] = useState(initialComments)
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const formattedTime = compact ? timeAgo(createdAt) : formatFullDate(createdAt)

  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      const newIsLiked = !isLiked
      // Optimistic update
      setIsLiked(newIsLiked)
      setLikes((prev) => (newIsLiked ? prev + 1 : prev - 1))
      if (onLike) {
        try {
          const serverCount = await onLike(id, newIsLiked)
          if (typeof serverCount === "number") setLikes(serverCount)
        } catch {
          // Rollback on error
          setIsLiked((prev) => !prev)
          setLikes((prev) => (newIsLiked ? prev - 1 : prev + 1))
        }
      }
    },
    [id, isLiked, onLike]
  )

  const handleArticleClick = useCallback(() => {
    if (href) router.push(href)
  }, [href, router])

  const handleComment = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setReplyOpen(true)
  }, [])

  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      const postUrl = `${window.location.origin}/post/${username}/${id}`
      if (navigator.share) {
        try {
          await navigator.share({ url: postUrl })
        } catch (err) {
          if (err instanceof Error && err.name !== "AbortError") throw err
        }
      } else {
        await navigator.clipboard.writeText(postUrl)
      }
    },
    [id, username]
  )

  return (
    <>
      <article
        aria-label={`Post by ${name}`}
        onClick={href ? handleArticleClick : undefined}
        className={cn(
          `flex w-full items-start gap-2.5 rounded-lg bg-background p-3.5 text-left transition-colors ${href ? "cursor-pointer active:bg-accent/50" : ""}`,
          className
        )}
      >
        {compact && showAvatar && <ProfileAvatar src={avatarUrl} alt={name} size='2xs' />}
        <div className='min-w-0 flex-1'>
          <div
            className={`flex items-start justify-between gap-2.5 ${compact ? "mb-0.5" : "mb-4"}`}
          >
            <div className='flex items-center gap-2'>
              {!compact && showAvatar && <ProfileAvatar src={avatarUrl} alt={name} size='2xs' />}
              <PostMeta
                name={name}
                username={username}
                createdAt={compact ? formattedTime : undefined}
                compact={compact}
              />
            </div>
            <PostMenu postId={id} username={username} authorId={authorId ?? id} />
          </div>

          <PostContent content={content} />
          {media && media.length > 0 && (
            <div
              className='mt-4 mb-4 flex max-w-75 flex-col gap-2 rounded-lg'
              onClick={(e) => e.stopPropagation()}
            >
              {media.map((item, i) =>
                item.type === "image" ? (
                  <MediaImage
                    key={item.id}
                    src={mediaUrl(`/api/media/images/${item.id}`)}
                    onClick={() => setViewerIndex(i)}
                  />
                ) : (
                  <AutoplayVideo
                    key={item.id}
                    src={mediaUrl(`/api/media/videos/${item.id}`)}
                    className='w-full max-w-75 cursor-pointer object-cover'
                    onMaximize={() => setViewerIndex(i)}
                  />
                )
              )}
            </div>
          )}

          {!compact && (
            <span className='mt-4 block px-0.5 text-xs text-muted-foreground'>{formattedTime}</span>
          )}

          <PostActions
            likes={likes}
            comments={comments}
            isLiked={isLiked}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            size={compact ? "sm" : "md"}
          />
        </div>
      </article>

      {media && media.length > 0 && (
        <MediaViewer
          items={media}
          open={viewerIndex !== null}
          index={viewerIndex ?? 0}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}

      {replyOpen && (
        <ReplyComposeDialog
          postId={id}
          parentUsername={username}
          onSuccess={() => {
            setComments((prev) => prev + 1)
            onReplyCreated?.()
          }}
          onDismiss={() => setReplyOpen(false)}
        />
      )}
    </>
  )
}

export default memo(Post)
