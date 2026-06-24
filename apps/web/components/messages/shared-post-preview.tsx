"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IconLoader2, IconAlertCircle, IconPhoto } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getPostDetail, type PostData } from "@/lib/actions/post-detail"
import { mediaUrl } from "@/lib/utils"

interface SharedPostPreviewProps {
  postId: string
  username: string
}

export function SharedPostPreview({ postId, username }: SharedPostPreviewProps) {
  const router = useRouter()
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPostDetail(postId)
      .then((detail) => {
        if (!cancelled) setPost(detail?.post ?? null)
      })
      .catch((err) => {
        console.error("[SharedPostPreview] Failed to load post:", err)
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [postId])

  const href = `/post/${username}/${postId}`

  if (loading) {
    return (
      <div className='flex w-64 items-center justify-center rounded-2xl bg-[var(--shared-preview-bg)] p-6'>
        <IconLoader2 size={20} className='animate-spin text-muted-foreground' />
      </div>
    )
  }

  if (error || !post) {
    return (
      <button
        onClick={() => router.push(href)}
        className='flex w-64 items-center gap-2 rounded-2xl bg-[var(--shared-preview-bg)] px-4 py-3 text-left text-[var(--shared-preview-fg)]'
      >
        <IconAlertCircle size={16} className='shrink-0 opacity-60' />
        <span className='text-sm opacity-80'>{href}</span>
      </button>
    )
  }

  const author = post.author
  const authorName = author
    ? [author.firstName, author.lastName].filter(Boolean).join(" ") || author.username
    : username

  const authorAvatarUrl = author?.avatarId
    ? author.avatarId.startsWith("http")
      ? author.avatarId
      : mediaUrl(`/api/media/images/${author.avatarId}`)
    : undefined

  const firstImage = post.media.find((m) => m.type === "image")
  const imageUrl = firstImage ? mediaUrl(`/api/media/images/${firstImage.id}`) : undefined

  const hasContent = !!post.content
  const hasImage = !!imageUrl

  return (
    <button
      onClick={() => router.push(href)}
      className='flex w-64 flex-col overflow-hidden rounded-2xl bg-[var(--shared-preview-bg)] text-left text-[var(--shared-preview-fg)] transition-opacity hover:opacity-90 active:opacity-70'
    >
      {/* Author header */}
      <div className='flex items-center gap-2 px-3 pt-3 pb-2'>
        <Avatar className='h-7 w-7 shrink-0'>
          {authorAvatarUrl && (
            <AvatarImage src={authorAvatarUrl} alt={authorName} className='object-cover' />
          )}
          <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>
            {(authorName?.[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className='truncate text-sm font-semibold text-[var(--shared-preview-fg)]'>
          @{author?.username ?? username}
        </span>
      </div>

      {/* Post image — only shown when the post actually has one */}
      {hasImage && (
        <div className='relative w-full overflow-hidden' style={{ maxHeight: "200px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt='Post image'
            className='w-full object-cover'
            style={{ maxHeight: "200px" }}
          />
        </div>
      )}

      {/* Post text content */}
      {hasContent && (
        <p className='line-clamp-3 px-3 py-2 text-sm leading-snug text-[var(--shared-preview-fg)] opacity-80'>
          {post.content}
        </p>
      )}

      {/* Fallback if no image and no content */}
      {!hasImage && !hasContent && (
        <div className={`flex items-center gap-2 px-3 pb-3 text-sm opacity-50`}>
          <IconPhoto size={16} />
          <span>Post</span>
        </div>
      )}
    </button>
  )
}
