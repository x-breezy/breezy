"use client"

import Post from "./post"
import { ProfileAvatar } from "../profile"
import { toggleLike } from "@/lib/actions/posts"
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

async function handleReplyLike(postId: string, liked: boolean) {
  const res = await toggleLike(postId, liked)
  return res.likesCount
}

function PostRow({
  comment,
  threadLine,
  onReplyCreated,
}: {
  comment: CommentNode
  threadLine: "solid" | "dashed" | "none"
  onReplyCreated?: () => void
}) {
  const authorName =
    [comment.author?.firstName, comment.author?.lastName].filter(Boolean).join(" ") ||
    comment.author?.username ||
    comment.authorId

  return (
    <div className='flex gap-3'>
      <div className='flex shrink-0 flex-col items-center'>
        <ProfileAvatar src={comment.author?.avatarId ?? undefined} alt={authorName} size='2xs' />
        {threadLine === "solid" && <div className='mt-1 w-px flex-1 bg-border' />}
        {threadLine === "dashed" && (
          <div className='mt-1 w-px flex-1 border-l border-dashed border-border' />
        )}
      </div>
      <div className='min-w-0 flex-1 pb-2'>
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
          onLike={handleReplyLike}
          onReplyCreated={onReplyCreated}
          showAvatar={false}
        />
      </div>
    </div>
  )
}

function CommentThread({
  comment,
  onReplyCreated,
}: {
  comment: CommentNode
  onReplyCreated?: () => void
}) {
  const ownerReplies = comment.replies

  return (
    <div>
      <PostRow
        comment={comment}
        threadLine={ownerReplies.length > 0 ? "solid" : "none"}
        onReplyCreated={onReplyCreated}
      />

      {ownerReplies.map((reply, i) => {
        const isLast = i === ownerReplies.length - 1
        const showRepliesLink = isLast && reply.commentsCount > 0
        const threadLine = !isLast ? "solid" : showRepliesLink ? "dashed" : "none"

        return (
          <div key={reply._id}>
            <PostRow comment={reply} threadLine={threadLine} onReplyCreated={onReplyCreated} />
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
}: {
  comments: CommentNode[]
  onReplyCreated?: () => void
}) {
  if (comments.length === 0) return null

  return (
    <div className='space-y-1'>
      {comments.map((comment) => (
        <CommentThread key={comment._id} comment={comment} onReplyCreated={onReplyCreated} />
      ))}
    </div>
  )
}
