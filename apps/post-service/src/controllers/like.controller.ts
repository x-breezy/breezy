import type { Request, Response, NextFunction } from "express"
import { LikeService } from "../services/like.service"
import { PostModel } from "../models/post.model"

export class LikeController {
  constructor(private service = new LikeService()) {}

  like = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const postId = req.params.postId!
      const post = await PostModel.findById(postId).exec()
      if (!post) {
        res.status(404).json({ success: false })
        return
      }
      const { alreadyLiked } = await this.service.like(postId, req.user.id)
      if (alreadyLiked) {
        res.status(409).json({ success: false })
        return
      }
      res.status(201).json({ success: true })
    } catch (err) {
      next(err)
    }
  }

  unlike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { wasLiked } = await this.service.unlike(req.params.postId!, req.user.id)
      if (!wasLiked) {
        res.status(404).json({ success: false })
        return
      }
      res.json({ success: true })
    } catch (err) {
      next(err)
    }
  }
}

export default LikeController
