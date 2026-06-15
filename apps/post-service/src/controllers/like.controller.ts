import type { Request, Response, NextFunction } from "express"
import { LikeService } from "../services/like.service"
import { PostModel } from "../models/post.model"

export class LikeController {
  constructor(private service = new LikeService()) {}

  getMyLikes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const raw = typeof req.query.postIds === "string" ? req.query.postIds : ""
      const postIds = raw ? raw.split(",").filter(Boolean) : []
      if (postIds.length === 0) {
        res.json({ success: true, data: [] })
        return
      }
      const liked = await this.service.getLikedPostIds(req.user!.id, postIds)
      res.json({ success: true, data: liked })
    } catch (err) {
      next(err)
    }
  }

  like = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = req.params.postId!
      const post = await PostModel.findById(postId).exec()
      if (!post) {
        res.status(404).json({ success: false, message: "Post not found" })
        return
      }
      const { alreadyLiked, nb } = await this.service.like(postId, req.user!.id)
      if (alreadyLiked) {
        res.status(409).json({ success: false, message: "Post already liked" })
        return
      }
      res
        .status(201)
        .json({ success: true, message: "Like added successfully", data: { likesCount: nb } })
    } catch (err) {
      next(err)
    }
  }

  unlike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { wasLiked, nb } = await this.service.unlike(req.params.postId!, req.user!.id)
      if (!wasLiked) {
        res.status(404).json({ success: false, message: "Like not found" })
        return
      }
      res
        .status(200)
        .json({ success: true, message: "Like removed successfully", data: { likesCount: nb } })
    } catch (err) {
      next(err)
    }
  }
}

export default LikeController
