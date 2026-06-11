"use client"

import { memo, useState, useCallback } from "react"
import { PostAvatar, PostMeta, PostMenu, PostContent, PostActions } from "./post"

interface HomePostProps {
  id: string
  name: string
  username: string
  content: string
  createdAt: string
  initialLikes?: number
  initialComments?: number
}

function HomePost({
  name,
  username,
  content,
  createdAt,
  initialLikes = 0,
  initialComments = 0,
}: HomePostProps) {
  const [likes, setLikes] = useState(initialLikes)
  const [isLiked, setIsLiked] = useState(false)

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const newIsLiked = !isLiked
      setIsLiked(newIsLiked)
      setLikes((prev) => (newIsLiked ? prev + 1 : prev - 1))
    },
    [isLiked]
  )

  return (
    <article
      aria-label={`Post by ${name}`}
      className='mx-auto flex w-full max-w-4xl gap-2.5 border-b border-border bg-background p-3.5 text-left transition-colors select-none active:bg-accent/50'
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
