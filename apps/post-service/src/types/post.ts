export interface MediaRef {
  id: string
  type: "image" | "video"
}

export interface MediaResolved extends MediaRef {
  url: string
  mimeType?: string
  width?: number
  height?: number
  size?: number
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
