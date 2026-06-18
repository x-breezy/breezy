"use client"

import { memo, useState, useCallback, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { PostMeta, PostContent, PostActions } from "."
import { PostMenu } from "./post-menu"
import { ProfileAvatar } from "../profile"
import { ReplyComposeDialog } from "./create-post/ReplyComposeDialog"
import type { SearchPostMedia } from "@/lib/actions/posts"
import { MediaViewer } from "../shared/medias/media-viewer"
import { AutoplayVideo } from "../shared/medias/autoplay-video"
import { MediaImage } from "../shared/medias/media-image"
import { mediaUrl, timeAgo, formatFullDate, cn } from "@/lib/utils"
import { UserRole } from "@/lib/auth/role"
import { usePostStore } from "@/stores/post-store"

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
  authorRole?: string
  compact?: boolean
  showAvatar?: boolean
  threadLine?: "solid" | "dashed"
  threadLineTop?: boolean
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
  authorRole,
  compact = true,
  showAvatar = true,
  threadLine,
  threadLineTop,
  className,
}: HomePostProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isDetailPage = pathname.startsWith("/post/")
  const storeLiked = usePostStore((s) => s.likedPostIds.has(id))
  const storeHasPost = usePostStore((s) => id in s.postsById)
  const [likes, setLikes] = useState(initialLikes)
  const [comments, setComments] = useState(initialComments)
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [postContent, setPostContent] = useState(content)

  useEffect(() => {
    if (storeHasPost) {
      setIsLiked(storeLiked)
    }
  }, [storeHasPost, storeLiked, id])
  const [postMedia, setPostMedia] = useState(media)
  const [deleted, setDeleted] = useState(false)
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

  if (deleted) return null

  return (
    <>
      <article
        aria-label={`Post by ${name}`}
        onClick={href ? handleArticleClick : undefined}
        className={cn(
          `relative flex w-full items-start gap-2.5 rounded-lg bg-background px-3.5 pt-3.5 pb-3.5 text-left transition-colors ${href ? "cursor-pointer active:bg-accent/50" : ""}`,
          className
        )}
      >
        {compact && showAvatar && (
          <div className='flex shrink-0 flex-col items-center'>
            <ProfileAvatar src={avatarUrl} alt={name} size='2xs' className='relative z-10' />
          </div>
        )}
        {compact && showAvatar && threadLineTop && (
          <div
            className='absolute w-px bg-border'
            style={{ left: "35.5px", top: 0, height: "36px" }}
          />
        )}
        {compact && showAvatar && threadLine === "solid" && (
          <div
            className='absolute w-px bg-border'
            style={{ left: "35.5px", top: "36px", bottom: 0 }}
          />
        )}
        {compact && showAvatar && threadLine === "dashed" && (
          <div
            className='absolute w-px border-l border-dashed border-border'
            style={{ left: "35.5px", top: "36px", bottom: 0 }}
          />
        )}
        <div className='min-w-0 flex-1'>
          <div
            className={`flex items-start justify-between gap-2.5 ${compact ? "mb-0.5" : "mb-4"}`}
          >
            <div className='flex items-center gap-2'>
              {!compact && showAvatar && <ProfileAvatar src={avatarUrl} alt={name} size='2xs' />}
              <PostMeta
                name={name}
                username={username}
                role={authorRole as UserRole | undefined}
                createdAt={compact ? formattedTime : undefined}
                compact={compact}
              />
            </div>
            <PostMenu
              postId={id}
              username={username}
              authorId={authorId ?? id}
              content={postContent}
              media={postMedia}
              onDeleted={() => {
                setDeleted(true)
                if (isDetailPage) router.back()
              }}
              onEdited={(c, m) => {
                setPostContent(c)
                setPostMedia(m)
              }}
            />
          </div>

          <PostContent content={postContent} />
          {postMedia && postMedia.length > 0 && (
            <div
              className='mt-4 mb-4 flex max-w-75 flex-col gap-2 rounded-lg'
              onClick={(e) => e.stopPropagation()}
            >
              {postMedia.map((item, i) =>
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

      {postMedia && postMedia.length > 0 && (
        <MediaViewer
          items={postMedia}
          open={viewerIndex !== null}
          index={viewerIndex ?? 0}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}

      {replyOpen && (
        <ReplyComposeDialog
          postId={id}
          parentName={name}
          parentUsername={username}
          parentAvatarUrl={avatarUrl}
          parentContent={content}
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
