import { CommentModel } from "../models/comment.model"
import { PostModel } from "../models/post.model"
import type { CreateCommentDTO } from "../schemas/comment.schema"
import type { Comment, NestedComment } from "../types/comment"
import type { PaginatedResponse } from "../types/api"

const NEST_DEPTH = 3

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
  ): Promise<PaginatedResponse<NestedComment>> {
    const filter = { postId, parentCommentId }
    const skip = (page - 1) * limit

    const [roots, total] = await Promise.all([
      CommentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      CommentModel.countDocuments(filter),
    ])

    const nested = await this.attachReplies(roots as unknown as Comment[], postId, 1)
    return { data: nested, total, page, limit }
  }

  private async attachReplies(
    comments: Comment[],
    postId: string,
    depth: number
  ): Promise<NestedComment[]> {
    if (comments.length === 0 || depth > NEST_DEPTH) {
      return comments.map((c) => ({ ...c, replies: [] }))
    }

    const ids = comments.map((c) => c.id ?? (c as unknown as { _id: unknown })._id?.toString())
    const children = await CommentModel.find({ postId, parentCommentId: { $in: ids } })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as Comment[]

    const nestedChildren = await this.attachReplies(children, postId, depth + 1)

    const repliesByParent = new Map<string, NestedComment[]>()
    for (const child of nestedChildren) {
      const parentId = String(child.parentCommentId)
      const bucket = repliesByParent.get(parentId) ?? []
      bucket.push(child)
      repliesByParent.set(parentId, bucket)
    }

    return comments.map((c) => {
      const id = String(c.id ?? (c as unknown as { _id: unknown })._id)
      return { ...c, replies: repliesByParent.get(id) ?? [] }
    })
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
