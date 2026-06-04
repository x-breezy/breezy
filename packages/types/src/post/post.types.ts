export interface IPost {
  id: string
  content: string
  authorId: string
  tags: string[]
  mediaIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface PostCreateDTO {
  content: string
  authorId: string
  tags?: string[]
  mediaIds?: string[]
}
