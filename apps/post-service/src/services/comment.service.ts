import { CommentModel } from "../models/comment.model"
import { PostModel } from "../models/post.model"
import type { CreateCommentDTO } from "../schemas/comment.schema"
import type { Comment } from "../types/comment"
import type { PaginatedResponse } from "../types/api"

export class CommentService {
  async createComment(postId: string, authorId: string, dto: CreateCommentDTO): Promise<Comment> {
    const comment = await CommentModel.create({
      content: dto.content,
      authorId,
      postId,
      parentCommentId: dto.parentCommentId ?? null,
    })
    await PostModel.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).exec()
    return comment as unknown as Comment
  }

  async listComments(
    postId: string,
    parentCommentId: string | null,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<Comment>> {
    const filter = { postId, parentCommentId }
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      CommentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      CommentModel.countDocuments(filter),
    ])
    return { data: data as unknown as Comment[], total, page, limit }
  }

  async getComment(commentId: string): Promise<Comment | null> {
    return CommentModel.findById(commentId).exec() as unknown as Promise<Comment | null>
  }

  async deleteComment(commentId: string): Promise<Comment | null> {
    const comment = await CommentModel.findByIdAndDelete(commentId).exec()
    if (!comment) return null
    await PostModel.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } }).exec()
    return comment as unknown as Comment
  }
}

export default CommentService
