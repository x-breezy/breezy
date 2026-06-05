import { LikeModel } from "../models/like.model"
import { PostModel } from "../models/post.model"
import PostService from "./post.service"

export class LikeService {
  constructor(private postService = new PostService()) {}

  async like(postId: string, userId: string): Promise<{ alreadyLiked: boolean; nb: number }> {
    const existing = await LikeModel.findOne({ postId, userId }).exec()
    if (existing) return { alreadyLiked: true, nb: 0 }
    await LikeModel.create({ postId, userId })
    const post = await PostModel.findByIdAndUpdate(
      postId,
      { $inc: { likesCount: 1 } },
      { new: true }
    ).exec()
    if (!post) throw Object.assign(new Error("Post not found"), { code: "POST_NOT_FOUND" })
    return { alreadyLiked: false, nb: post.likesCount }
  }

  async unlike(postId: string, userId: string): Promise<{ wasLiked: boolean; nb: number }> {
    const post = await this.postService.getPost(postId)
    if (!post) return { wasLiked: false, nb: 0 }

    const deleted = await LikeModel.findOneAndDelete({ postId, userId }).exec()
    if (!deleted) return { wasLiked: false, nb: 0 }
    const updated = await PostModel.findByIdAndUpdate(
      postId,
      { $inc: { likesCount: -1 } },
      { new: true }
    ).exec()
    if (!updated) throw Object.assign(new Error("Post not found"), { code: "POST_NOT_FOUND" })
    return { wasLiked: true, nb: updated.likesCount }
  }
}

export default LikeService
