import { LikeModel } from "../models/like.model"
import { PostModel } from "../models/post.model"
import { publish } from "../clients/rabbitmq"
import { getActorProfile } from "../clients/grpc.client"

export class LikeService {
  async like(postId: string, userId: string): Promise<{ alreadyLiked: boolean; nb: number }> {
    try {
      await LikeModel.create({ postId, userId })
    } catch (err) {
      if ((err as { code?: number }).code === 11000) return { alreadyLiked: true, nb: 0 }
      throw err
    }
    const post = await PostModel.findByIdAndUpdate(
      postId,
      { $inc: { likesCount: 1 } },
      { new: true }
    ).exec()
    if (!post) throw Object.assign(new Error("Post not found"), { code: "POST_NOT_FOUND" })
    if (post.authorId !== userId) {
      const [actorProfile, authorProfile] = await Promise.all([
        getActorProfile(userId),
        getActorProfile(post.authorId),
      ])
      if (authorProfile?.role === "moderator" || authorProfile?.role === "admin") {
        return { alreadyLiked: false, nb: post.likesCount }
      }
      void publish("content.like", {
        actorId: userId,
        targetUserId: post.authorId,
        postId,
        username: actorProfile?.username,
        avatarId: actorProfile?.avatarId,
      })
    }
    return { alreadyLiked: false, nb: post.likesCount }
  }

  async getLikedPostIds(userId: string, postIds: string[]): Promise<string[]> {
    const docs = await LikeModel.find({ userId, postId: { $in: postIds } })
      .select("postId")
      .exec()
    return docs.map((d) => d.postId)
  }

  async unlike(postId: string, userId: string): Promise<{ wasLiked: boolean; nb: number }> {
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
