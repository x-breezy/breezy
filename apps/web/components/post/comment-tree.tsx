"use client"

import { useState } from "react"
import { ProfileAvatar } from "@/components/profile"
import { MediaImage } from "@/components/shared/medias/media-image"
import { AutoplayVideo } from "@/components/shared/medias/autoplay-video"
import { MediaViewer } from "@/components/shared/medias/media-viewer"
import { timeAgo, mediaUrl, cn } from "@/lib/utils"
import type { MediaItem } from "@/lib/actions/post-detail"

interface CommentAuthor {
  username: string
  avatarId: string | null
}

export interface CommentNode {
  _id: string
  content: string
  authorId: string
  media: MediaItem[]
  createdAt: string
  author: CommentAuthor | null
  replies: CommentNode[]
}

function CommentCard({ comment, depth }: { comment: CommentNode; depth: number }) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  return (
    <div className={cn("flex gap-2", depth > 0 ? "ml-8 border-l border-border pl-4" : "")}>
      <ProfileAvatar
        src={comment.author?.avatarId ?? undefined}
        alt={comment.author?.username ?? "User"}
        size='2xs'
        className='mt-0.5 shrink-0'
      />
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1.5'>
          <span className='text-sm font-semibold'>{comment.author?.username ?? "unknown"}</span>
          <span className='text-xs text-muted-foreground'>{timeAgo(comment.createdAt)}</span>
        </div>
        <p className='mt-0.5 text-sm whitespace-pre-wrap text-foreground'>{comment.content}</p>
        {comment.media.length > 0 && (
          <div
            className={cn(
              "mt-1.5 grid gap-1 overflow-hidden rounded-lg",
              comment.media.length === 1 ? "" : "grid-cols-2"
            )}
          >
            {comment.media.map((item, i) =>
              item.type === "image" ? (
                <MediaImage
                  key={item.id}
                  src={mediaUrl(`/api/media/images/${item.id}`)}
                  onClick={() => setViewerIndex(i)}
                />
              ) : (
                <AutoplayVideo
                  key={item.id}
                  src={mediaUrl(`/api/media/videos/${item.id}`)}
                  className='w-full max-w-75 cursor-pointer rounded-lg object-cover'
                  onMaximize={() => setViewerIndex(i)}
                />
              )
            )}
          </div>
        )}
        {comment.replies.length > 0 && (
          <div className='mt-1 space-y-1'>
            <CommentTree comments={comment.replies} depth={depth + 1} />
          </div>
        )}
      </div>
      {comment.media.length > 0 && (
        <MediaViewer
          items={comment.media}
          open={viewerIndex !== null}
          index={viewerIndex ?? 0}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}

export function CommentTree({ comments, depth = 0 }: { comments: CommentNode[]; depth?: number }) {
  if (comments.length === 0) return null

  return (
    <div className='space-y-3'>
      {comments.map((comment) => (
        <CommentCard key={comment._id} comment={comment} depth={depth} />
      ))}
    </div>
  )
}
