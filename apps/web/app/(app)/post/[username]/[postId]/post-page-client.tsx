"use client"

import { useEffect, useState, useCallback } from "react"
import { notFound, useRouter } from "next/navigation"
import { getPostDetail } from "@/lib/actions/post-detail"
import { usePostStore } from "@/stores/post-store"
import Post from "@/components/post/post"
import { CommentTree } from "@/components/post/comment-tree"
import { AppLoader } from "@/components/layout/app-loader"
import { Button } from "@/components/ui/button"
import { IconChevronLeft } from "@tabler/icons-react"
import type { PostDetail } from "@/lib/actions/post-detail"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

export function PostPageClient({ postId }: { username: string; postId: string }) {
  const router = useRouter()
  const toggleLike = usePostStore((s) => s.toggleLike)

  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    getPostDetail(postId)
      .then((d) => {
        if (d) {
          setDetail(d)
          usePostStore.setState((s) => ({
            postsById: { ...s.postsById, [postId]: d.post },
            likedPostIds: d.likedByMe
              ? new Set([...s.likedPostIds, postId])
              : new Set([...s.likedPostIds].filter((id) => id !== postId)),
          }))
        } else {
          setNotFoundState(true)
        }
        setInitialLoading(false)
      })
      .catch(() => setInitialLoading(false))
  }, [postId, refreshKey])

  const handleReplyCreated = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  const handleLike = useCallback(
    async (_pid: string, liked: boolean) => {
      return toggleLike(postId, liked)
    },
    [postId, toggleLike]
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
            <Button
              variant='ghost'
              size='icon-lg'
              onClick={() => router.back()}
              aria-label='Go back'
            >
              <IconChevronLeft size={22} strokeWidth={2} />
            </Button>
          }
          center={<h1 className='text-lg font-bold'>Post</h1>}
        />
      </PageHeader>

      <div className='container-center'>
        <Post
          id={post._id}
          name={authorName}
          username={post.author?.username ?? post.authorId}
          authorId={post.authorId}
          authorRole={post.author?.role}
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
          <CommentTree
            comments={replies}
            onReplyCreated={handleReplyCreated}
            postAuthorId={post.authorId}
          />
        )}
      </section>
    </>
  )
}
