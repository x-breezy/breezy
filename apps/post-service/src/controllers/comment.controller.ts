import type { Request, Response, NextFunction } from "express"
import { CommentService } from "../services/comment.service"
import { PostModel } from "../models/post.model"
import { ROLES } from "../constants/roles"

export class CommentController {
  constructor(private service = new CommentService()) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = req.params.postId!
      const parentCommentId = req.query.parentCommentId
        ? (req.query.parentCommentId as string)
        : null
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const result = await this.service.listComments(postId, parentCommentId, page, limit)
      res.json({ success: true, data: result })
    } catch (err) {
      next(err)
    }
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = req.params.postId!
      const post = await PostModel.findById(postId).exec()
      if (!post) {
        res.status(404).json({ success: false, error: "Post not found" })
        return
      }
      const comment = await this.service.createComment(postId, req.user.id, req.body)
      res.status(201).json({ success: true, data: comment })
    } catch (err) {
      next(err)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const comment = await this.service.getComment(req.params.commentId!)
      if (!comment) {
        res.status(404).json({ success: false, error: "Not found" })
        return
      }
      const isOwner = comment.authorId === req.user.id
      const isElevated = (req.user.roles as string[]).some((r) =>
        ([ROLES.MODERATOR, ROLES.ADMIN] as string[]).includes(r)
      )
      if (!isOwner && !isElevated) {
        res.status(403).json({ success: false, error: "Forbidden" })
        return
      }
      await this.service.deleteComment(req.params.commentId!)
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }
}

export default CommentController
