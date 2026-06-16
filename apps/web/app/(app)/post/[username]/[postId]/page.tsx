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

export default function PostPage({
  params,
}: {
  params: Promise<{ username: string; postId: string }>
}) {
  const { postId } = use(params)
  const router = useRouter()

  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getPostDetail(postId)
      .then((d) => {
        if (d) setDetail(d)
        else setNotFoundState(true)
        setInitialLoading(false)
      })
      .catch(() => setInitialLoading(false))
  }, [postId, refreshKey])

  const handleReplyCreated = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleLike = useCallback(
    async (_postId: string, liked: boolean) => {
      const res = await toggleLike(postId, liked)
      return res.likesCount
    },
    [postId]
  )

  if (initialLoading) return <AppLoader />
  if (notFoundState) notFound()
  if (!detail) return null

  const { post, replies } = detail

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
          createdAt={post.createdAt}
          initialLikes={post.likesCount}
          initialComments={post.commentsCount}
          initialLiked={detail.likedByMe}
          onLike={handleLike}
          onReplyCreated={handleReplyCreated}
          compact={false}
        />
      </div>

      <section className='container-center p-4'>
        <h2 className='mb-4 text-sm font-semibold text-muted-foreground'>
          Replies {post.commentsCount > 0 && `(${post.commentsCount})`}
        </h2>
        {replies.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>No replies yet.</p>
        ) : (
          <CommentTree comments={replies} onReplyCreated={handleReplyCreated} />
        )}
      </section>
    </>
  )
}
