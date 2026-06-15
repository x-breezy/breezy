import type { MediaRef } from "./post"

export interface CommentWithAuthor {
  id: string
  content: string
  authorId: string
  postId: string
  parentCommentId: string | null
  media: MediaRef[]
  createdAt: Date
  updatedAt: Date
  author: {
    username: string
    avatarId: string | null
    firstName: string | null
    lastName: string | null
  } | null
  replies: CommentWithAuthor[]
}

export interface PostDetail {
  post: {
    id: string
    content: string
    authorId: string
    tags: string[]
    mentions: string[]
    media: MediaRef[]
    likesCount: number
    commentsCount: number
    createdAt: Date
    updatedAt: Date
    author: {
      username: string
      avatarId: string | null
      firstName: string | null
      lastName: string | null
    } | null
  }
  likedByMe: boolean
  comments: CommentWithAuthor[]
}
