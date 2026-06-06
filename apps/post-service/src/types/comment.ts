import type { MediaRef } from "./post"

export interface Comment {
  id: string
  content: string
  authorId: string
  postId: string
  parentCommentId: string | null
  media: MediaRef[]
  createdAt: Date
  updatedAt: Date
}

export interface NestedComment extends Comment {
  replies: NestedComment[]
}
