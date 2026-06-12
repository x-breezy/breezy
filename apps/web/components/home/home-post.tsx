"use client"

import { memo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PostAvatar, PostMeta, PostMenu, PostContent, PostActions } from "./post"

interface HomePostProps {
  id: string
  name: string
  username: string
  content: string
  createdAt: string
  initialLikes?: number
  initialComments?: number
  initialLiked?: boolean
  href?: string
  onLike?: (postId: string, newLiked: boolean) => Promise<number | void>
}

function HomePost({
  id,
  name,
  username,
  content,
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
    <article
      aria-label={`Post by ${name}`}
      onClick={href ? handleArticleClick : undefined}
      className={`mx-auto flex w-full max-w-4xl gap-2.5 border-b border-border bg-background p-3.5 text-left transition-colors select-none active:bg-accent/50${href ? "cursor-pointer" : ""}`}
    >
      <PostAvatar name={name} />

      <div className='flex-1'>
        <div className='mb-0.5 flex items-center justify-between'>
          <PostMeta name={name} username={username} createdAt={createdAt} />
          <PostMenu />
        </div>

        <PostContent content={content} />
        <PostActions
          likes={likes}
          comments={initialComments}
          isLiked={isLiked}
          onLike={handleLike}
        />
      </div>
    </article>
  )
}

export default memo(HomePost)
