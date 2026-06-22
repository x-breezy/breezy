"use client"

import Post from "./post"
import { usePostStore } from "@/stores/post-store"
import type { MediaItem, ProfileRef } from "@/lib/actions/post-detail"

export interface CommentNode {
  _id: string
  content: string
  authorId: string
  parentId?: string
  tags: string[]
  mentions: string[]
  media: MediaItem[]
  likesCount: number
  commentsCount: number
  createdAt: string
  author: ProfileRef | null
  likedByMe: boolean
  replies: CommentNode[]
}

function PostRow({
  comment,
  threadLine,
  threadLineTop,
  onReplyCreated,
  postAuthorId,
}: {
  comment: CommentNode
  threadLine: "solid" | "dashed" | "none"
  threadLineTop?: boolean
  onReplyCreated?: () => void
  postAuthorId?: string
}) {
  const toggleLike = usePostStore((s) => s.toggleLike)
  const authorName =
    [comment.author?.firstName, comment.author?.lastName].filter(Boolean).join(" ") ||
    comment.author?.username ||
    comment.authorId
  const isPostAuthor = postAuthorId !== undefined && comment.authorId === postAuthorId

  return (
    <div>
      <Post
        id={comment._id}
        name={authorName}
        username={comment.author?.username ?? comment.authorId}
        authorId={comment.authorId}
        authorRole={comment.author?.role}
        avatarUrl={comment.author?.avatarId ?? undefined}
        content={comment.content}
        media={comment.media}
        createdAt={comment.createdAt}
        initialLikes={comment.likesCount}
        initialComments={comment.commentsCount}
        initialLiked={comment.likedByMe}
        href={`/post/${comment.author?.username ?? comment.authorId}/${comment._id}`}
        onLike={toggleLike}
        onReplyCreated={onReplyCreated}
        threadLine={threadLine !== "none" ? threadLine : undefined}
        threadLineTop={threadLineTop}
        isPostAuthor={isPostAuthor}
      />
    </div>
  )
}

function CommentThread({
  comment,
  onReplyCreated,
  isLastThread,
  postAuthorId,
}: {
  comment: CommentNode
  onReplyCreated?: () => void
  isLastThread?: boolean
  postAuthorId?: string
}) {
  const ownerReplies = comment.replies
  const hasReplies = ownerReplies.length > 0

  return (
    <div>
      <PostRow
        comment={comment}
        threadLine={hasReplies ? "solid" : "none"}
        onReplyCreated={onReplyCreated}
        postAuthorId={postAuthorId}
      />

      {ownerReplies.map((reply, i) => {
        const isLast = i === ownerReplies.length - 1
        const showRepliesLink = isLast && reply.commentsCount > 0
        const threadLine = !isLast ? "solid" : showRepliesLink ? "dashed" : "none"

        return (
          <div key={reply._id}>
            <PostRow
              comment={reply}
              threadLine={threadLine}
              threadLineTop
              onReplyCreated={onReplyCreated}
              postAuthorId={postAuthorId}
            />
            {showRepliesLink && (
              <div className='flex gap-3'>
                <div className='w-5 shrink-0' />
                <a
                  href={`/post/${reply.author?.username ?? reply.authorId}/${reply._id}`}
                  className='mb-2 text-sm font-medium text-primary hover:underline'
                >
                  Show replies
                </a>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function CommentTree({
  comments,
  onReplyCreated,
  postAuthorId,
}: {
  comments: CommentNode[]
  onReplyCreated?: () => void
  postAuthorId?: string
}) {
  if (comments.length === 0) return null

  return (
    <div>
      {comments.map((comment, i) => (
        <div key={comment._id} className='border-b border-border last:border-b-0'>
          <CommentThread
            comment={comment}
            onReplyCreated={onReplyCreated}
            isLastThread={i === comments.length - 1}
            postAuthorId={postAuthorId}
          />
        </div>
      ))}
    </div>
  )
}
