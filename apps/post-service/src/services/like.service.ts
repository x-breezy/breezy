import { LikeModel } from "../models/like.model"
import { PostModel } from "../models/post.model"

export class LikeService {
  async like(postId: string, userId: string): Promise<{ alreadyLiked: boolean }> {
    const existing = await LikeModel.findOne({ postId, userId }).exec()
    if (existing) return { alreadyLiked: true }
    await LikeModel.create({ postId, userId })
    await PostModel.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } }).exec()
    return { alreadyLiked: false }
  }

  async unlike(postId: string, userId: string): Promise<{ wasLiked: boolean }> {
    const deleted = await LikeModel.findOneAndDelete({ postId, userId }).exec()
    if (!deleted) return { wasLiked: false }
    await PostModel.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } }).exec()
    return { wasLiked: true }
  }
}

export default LikeService
