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

  getDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const detail = await this.service.getPostDetail(req.params.id!, req.user!.id)
      if (!detail) {
        res.status(404).json({ success: false, error: "Not found", message: "Post not found" })
        return
      }
      res.json({ success: true, data: detail, message: "Post detail retrieved successfully" })
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

  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = (req.query.q as string | undefined)?.trim() ?? ""
      if (!q) {
        res.status(400).json({ success: false, message: "Query parameter 'q' is required" })
        return
      }
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
      const rawAuthorIds = typeof req.query.authorIds === "string" ? req.query.authorIds : ""
      const authorIds = rawAuthorIds ? rawAuthorIds.split(",").filter(Boolean) : undefined
      const result = await this.service.search(q, page, limit, authorIds, req.user!.id)
      res.json({ success: true, data: result, message: "Search results retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  trendingTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10))
      const tags = await this.service.trendingTags(limit)
      res.json({ success: true, data: tags, message: "Trending tags retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }
}
