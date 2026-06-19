"use client"

import { useEffect, useState, useCallback } from "react"
import { notFound, useRouter } from "next/navigation"
import { getPostDetail, getPostsContext } from "@/lib/actions/post-detail"
import { usePostStore } from "@/stores/post-store"
import Post from "@/components/post/post"
import { CommentTree } from "@/components/post/comment-tree"
import { PostContent } from "@/components/post/post-content"
import { ProfileAvatar } from "@/components/profile"
import { AppLoader } from "@/components/layout/app-loader"
import { Button } from "@/components/ui/button"
import { IconChevronLeft } from "@tabler/icons-react"
import type { PostDetail } from "@/lib/actions/post-detail"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

export function PostPageClient({ postId }: { username: string; postId: string }) {
  const router = useRouter()
  const toggleLike = usePostStore((s) => s.toggleLike)

  const [detail, setDetail] = useState<PostDetail | null>(null)
  const [pageReady, setPageReady] = useState(false)
  const [notFoundState, setNotFoundState] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [parentPost, setParentPost] = useState<PostDetail["post"] | null>(null)

  useEffect(() => {
    setPageReady(false)
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
          if (d.post.parentId) {
            getPostsContext([d.post.parentId]).then((ctx) => {
              if (ctx.length > 0) setParentPost(ctx[0]!.post)
              setPageReady(true)
            })
          } else {
            setPageReady(true)
          }
        } else {
          setNotFoundState(true)
          setPageReady(true)
        }
      })
      .catch(() => setPageReady(true))
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

  if (!pageReady) return <AppLoader />
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
        {parentPost && (
          <a
            href={`/post/${parentPost.author?.username ?? parentPost.authorId}/${parentPost._id}`}
            className='flex gap-2.5 px-4 pt-3 pb-1 transition-colors hover:bg-accent/50'
          >
            <div className='flex shrink-0 flex-col items-center'>
              <ProfileAvatar
                src={parentPost.author?.avatarId ?? undefined}
                alt={parentPost.author?.username ?? parentPost.authorId}
                size='2xs'
              />
              <div className='my-1.5 w-px flex-1 bg-border' />
            </div>
            <div className='min-w-0 flex-1 pb-3'>
              <div className='flex items-center gap-1.5'>
                <span className='truncate text-sm font-semibold hover:underline'>
                  {parentPost.author?.firstName ??
                    parentPost.author?.username ??
                    parentPost.authorId}
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  @{parentPost.author?.username ?? parentPost.authorId}
                </span>
              </div>
              <PostContent
                content={
                  parentPost.content.length > 250
                    ? parentPost.content.slice(0, 250) + "…"
                    : parentPost.content
                }
              />
              <div className='mt-2 text-sm text-muted-foreground'>
                Replying to{" "}
                <span className='font-semibold text-primary'>
                  @{parentPost.author?.username ?? parentPost.authorId}
                </span>
              </div>
            </div>
          </a>
        )}
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

      <section className='container-center'>
        <h2 className='border-b border-border px-4 pt-4 pb-2 text-sm font-semibold text-muted-foreground'>
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
