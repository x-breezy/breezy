export interface Post {
  id: string
  content: string
  authorId: string
  tags: string[]
  mediaIds: string[]

  likesCount: number
  commentsCount: number

  createdAt: Date
  updatedAt: Date
}

export interface PostCreateDTO {
  content: string
  authorId: string
  tags?: string[]
  mediaIds?: string[]
}
