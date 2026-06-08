import { CommentModel } from "../models/comment.model"
import { PostModel } from "../models/post.model"
import type { CreateCommentDTO } from "../schemas/comment.schema"
import type { Comment, NestedComment } from "../types/comment"
import type { PaginatedResponse } from "../types/api"

const NEST_DEPTH = 3

export class CommentService {
  async createComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDTO
  ): Promise<{ comment: Comment; commentsCount: number }> {
    const comment = await CommentModel.create({
      content: dto.content,
      authorId,
      postId,
      parentCommentId: dto.parentCommentId ?? null,
      media: dto.media ?? [],
    })
    const post = await PostModel.findByIdAndUpdate(
      postId,
      { $inc: { commentsCount: 1 } },
      { new: true }
    ).exec()
    if (!post) throw Object.assign(new Error("Post not found"), { code: "POST_NOT_FOUND" })
    return { comment: comment as Comment, commentsCount: post.commentsCount }
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
      CommentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean({ virtuals: true })
        .exec(),
      CommentModel.countDocuments({ postId }),
    ])

    const nested = await this.attachReplies(roots as Comment[], postId, 1)
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

    const ids = comments.map((c) => c.id)
    const children = (await CommentModel.find({ postId, parentCommentId: { $in: ids } })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true })
      .exec()) as Comment[]

    const nestedChildren = await this.attachReplies(children, postId, depth + 1)

    const repliesByParent = new Map<string, NestedComment[]>()
    for (const child of nestedChildren) {
      const parentId = String(child.parentCommentId)
      const bucket = repliesByParent.get(parentId) ?? []
      bucket.push(child)
      repliesByParent.set(parentId, bucket)
    }

    return comments.map((c) => {
      const id = String(c.id)
      return { ...c, replies: repliesByParent.get(id) ?? [] }
    })
  }

  async getComment(commentId: string): Promise<Comment | null> {
    return CommentModel.findById(commentId).exec() as Promise<Comment | null>
  }

  async deleteComment(
    commentId: string
  ): Promise<{ comment: Comment; commentsCount: number } | null> {
    const comment = await CommentModel.findByIdAndDelete(commentId).exec()
    if (!comment) return null
    const post = await PostModel.findByIdAndUpdate(
      comment.postId,
      [{ $set: { commentsCount: { $max: [0, { $subtract: ["$commentsCount", 1] }] } } }],
      { new: true }
    ).exec()
    if (!post) throw Object.assign(new Error("Post not found"), { code: "POST_NOT_FOUND" })
    return { comment: comment as Comment, commentsCount: post.commentsCount }
  }
}

export default CommentService
