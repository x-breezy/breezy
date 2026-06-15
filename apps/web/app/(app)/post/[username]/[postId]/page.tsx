"use client"

import { use, useEffect, useState, useCallback } from "react"
import { notFound, useRouter } from "next/navigation"
import { getPostDetail } from "@/lib/actions/post-detail"
import { toggleLike } from "@/lib/actions/posts"
import Post from "@/components/post/post"
import { CommentTree } from "@/components/post/comment-tree"
import { AppLoader } from "@/components/layout/app-loader"
import { IconChevronLeft } from "@tabler/icons-react"
import type { PostDetail } from "@/lib/actions/post-detail"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import { timeAgo } from "@/lib/utils"

export default function PostPage({
  params,
}: {
  params: Promise<{ username: string; postId: string }>
}) {
  const { postId } = use(params)
  const router = useRouter()

  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    setLoading(true)
    getPostDetail(postId)
      .then((d) => {
        if (d) setDetail(d)
        else setNotFoundState(true)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [postId])

  const [likes, setLikes] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (detail) {
      setLikes(detail.post.likesCount)
      setIsLiked(detail.likedByMe)
    }
  }, [detail])

  const handleLike = useCallback(
    async (_postId: string, newLiked: boolean) => {
      const newIsLiked = newLiked
      setIsLiked(newIsLiked)
      setLikes((prev) => (newIsLiked ? prev + 1 : prev - 1))
      try {
        const res = await toggleLike(postId, newLiked)
        setLikes(res.likesCount)
        return res.likesCount
      } catch {
        setIsLiked((prev) => !prev)
        setLikes((prev) => (newIsLiked ? prev - 1 : prev + 1))
      }
    },
    [postId]
  )

  if (loading) return <AppLoader />
  if (notFoundState) notFound()
  if (!detail) return null

  const { post, comments } = detail

  const authorName =
    [post.author?.firstName, post.author?.lastName].filter(Boolean).join(" ") ||
    post.author?.username ||
    post.authorId

  return (
    <>
      <PageHeader>
        <PageHeaderContent
          left={
            <button
              onClick={() => router.back()}
              aria-label='Go back'
              className='flex items-center gap-2'
            >
              <IconChevronLeft size={22} strokeWidth={2} />
              <h1 className='text-lg font-bold'>Post</h1>
            </button>
          }
        />
      </PageHeader>

      <div className='container-center'>
        <Post
          id={post._id}
          name={authorName}
          username={post.author?.username ?? post.authorId}
          authorId={post.authorId}
          avatarUrl={post.author?.avatarId ?? undefined}
          content={post.content}
          media={post.media}
          createdAt={timeAgo(post.createdAt)}
          initialLikes={likes}
          initialComments={post.commentsCount}
          initialLiked={isLiked}
          onLike={handleLike}
        />
      </div>

      <section className='container-center p-4'>
        <h2 className='mb-4 text-sm font-semibold text-muted-foreground'>
          Comments {post.commentsCount > 0 && `(${post.commentsCount})`}
        </h2>
        {comments.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>No comments yet.</p>
        ) : (
          <CommentTree comments={comments} />
        )}
      </section>
    </>
  )
}
