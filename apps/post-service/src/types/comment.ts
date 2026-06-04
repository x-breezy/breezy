export interface Comment {
  id: string
  content: string
  authorId: string
  postId: string
  parentCommentId: string | null

  createdAt: Date
  updatedAt: Date
}
