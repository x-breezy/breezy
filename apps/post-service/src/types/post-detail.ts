import type { MediaRef } from "./post"

export interface ProfileRef {
  username: string
  avatarId: string | null
  firstName: string | null
  lastName: string | null
  role?: string
}

export interface ReplyPost {
  _id: string
  content: string
  authorId: string
  parentId?: string
  tags: string[]
  mentions: string[]
  media: MediaRef[]
  likesCount: number
  commentsCount: number
  createdAt: Date
  updatedAt: Date
  author: ProfileRef | null
  likedByMe: boolean
  replies: ReplyPost[]
}

export interface PostDetail {
  post: {
    id: string
    content: string
    authorId: string
    tags: string[]
    mentions: string[]
    media: MediaRef[]
    parentId?: string
    rootParentId?: string
    likesCount: number
    commentsCount: number
    createdAt: Date
    updatedAt: Date
    author: ProfileRef | null
  }
  likedByMe: boolean
  replies: ReplyPost[]
}
