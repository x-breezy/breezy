import type { Request, Response, NextFunction } from "express"
import { PostService } from "../services/post.service"

export class PostController {
  constructor(private service = new PostService()) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await this.service.createPost({ ...req.body, authorId: req.user!.id })
      res.status(201).json({ success: true, data: post, message: "Post created successfully" })
    } catch (err) {
      next(err)
    }
  }

  getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const post = await this.service.getPost(req.params.id!)
      if (!post) {
        res.status(404).json({ success: false, error: "Not found", message: "Post not found" })
        return
      }
      res.json({ success: true, data: post, message: "Post retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  getFeed = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const result = await this.service.feed(req.user!.id, page, limit)

      res.json({ success: true, data: result, message: "Feed retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  getUserPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
      const result = await this.service.byUser(req.params.userId!, page, limit)

      res.json({ success: true, data: result, message: "User posts retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const deleted = await this.service.deletePost(req.params.id!)
      if (!deleted) {
        res.status(404).json({ success: false, message: "Post not found" })
        return
      }
      res.json({ success: true, message: "Post deleted successfully" })
    } catch (err) {
      next(err)
    }
  }
}
