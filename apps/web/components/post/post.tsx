"use client"

import { memo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PostMeta, PostMenu, PostContent, PostActions } from "."
import { ProfileAvatar } from "../profile"
import type { SearchPostMedia } from "@/lib/actions/posts"
import Image from "next/image"
import { MediaViewer } from "../shared/media-viewer"
import { AutoplayVideo } from "../shared/autoplay-video"

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
}: HomePostProps) {
  const router = useRouter()
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(initialLiked)
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

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

  return (
    <>
      <article
        aria-label={`Post by ${name}`}
        onClick={href ? handleArticleClick : undefined}
        className={`flex w-full items-start gap-2.5 bg-background p-3.5 text-left transition-colors select-none active:bg-accent/50${href ? "cursor-pointer" : ""}`}
      >
        <ProfileAvatar src={avatarUrl} alt={name} size='2xs' />

        <div className='min-w-0 flex-1'>
          <div className='mb-0.5 flex items-center justify-between'>
            <PostMeta name={name} username={username} createdAt={createdAt} />
            <PostMenu />
          </div>

          <PostContent content={content} />
          {media && media.length > 0 && (
            <div
              className={`mt-2 grid gap-1 overflow-hidden rounded-lg${media.length === 1 ? "" : "grid-cols-2"}`}
              onClick={(e) => e.stopPropagation()}
            >
              {media.map((item, i) =>
                item.type === "image" ? (
                  <Image
                    key={item.id}
                    src={`/api/media/images/${item.id}`}
                    alt=''
                    width={300}
                    height={300}
                    unoptimized
                    loading='lazy'
                    className='w-full max-w-75 cursor-pointer rounded-lg object-cover'
                    onClick={() => setViewerIndex(i)}
                  />
                ) : (
                  <AutoplayVideo
                    key={item.id}
                    src={`/api/media/videos/${item.id}`}
                    className='w-full max-w-75 cursor-pointer rounded-lg object-cover'
                    onClick={() => setViewerIndex(i)}
                  />
                )
              )}
            </div>
          )}
          <PostActions
            likes={likes}
            comments={initialComments}
            isLiked={isLiked}
            onLike={handleLike}
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
    </>
  )
}

export default memo(Post)
