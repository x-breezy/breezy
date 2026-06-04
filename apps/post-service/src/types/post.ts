export interface MediaRef {
  id: string
  type: "image" | "video"
}

export interface Post {
  id: string
  content: string
  authorId: string
  tags: string[]
  media: MediaRef[]

  likesCount: number
  commentsCount: number

  createdAt: Date
  updatedAt: Date
}
