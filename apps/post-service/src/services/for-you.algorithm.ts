import { PostModel } from "../models/post.model"
import { LikeModel } from "../models/like.model"
import type { Post } from "../types/post"
import type { PaginatedResponse } from "../types/api"

const POOL_SIZE = 200
const LIKE_HISTORY = 50
const TAG_WEIGHT_MULTIPLIER = 3
const FRESHNESS_WINDOW_HOURS = 10
const FRESHNESS_MAX_BONUS = 10

export async function forYouFeed(
  viewerId: string,
  page: number,
  limit: number
): Promise<PaginatedResponse<Post>> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const now = Date.now()

  // Signal 1: tag affinity from recent likes
  const recentLikeIds = (
    await LikeModel.find({ userId: viewerId })
      .sort({ createdAt: -1 })
      .limit(LIKE_HISTORY)
      .select("postId")
      .lean()
      .exec()
  ).map((l) => String(l.postId))

  const tagWeights = new Map<string, number>()
  if (recentLikeIds.length > 0) {
    const likedPosts = await PostModel.find({ _id: { $in: recentLikeIds } })
      .select("tags")
      .lean()
      .exec()
    for (const p of likedPosts) {
      for (const tag of (p as unknown as { tags: string[] }).tags ?? []) {
        tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + 1)
      }
    }
  }

  const filter: Record<string, unknown> = {
    authorId: { $ne: viewerId },
    parentId: null,
    createdAt: { $gte: sevenDaysAgo },
    ...(recentLikeIds.length > 0 && { _id: { $nin: recentLikeIds } }),
  }

  const [pool, total] = await Promise.all([
    PostModel.find(filter).sort({ createdAt: -1 }).lean({ virtuals: true }).limit(POOL_SIZE).exec(),
    PostModel.countDocuments(filter),
  ])

  const scored = pool
    .map((post) => {
      const p = post as unknown as Post & { tags: string[] }
      const ageHours = (now - new Date(p.createdAt).getTime()) / 3_600_000

      // Signal 2: engagement (likes + weighted comments)
      const engagement = (p.likesCount ?? 0) + (p.commentsCount ?? 0) * 2

      // Signal 3: tag affinity
      const tagBoost = (p.tags ?? []).reduce(
        (s, tag) => s + (tagWeights.get(tag) ?? 0) * TAG_WEIGHT_MULTIPLIER,
        0
      )

      // Signal 4: freshness bonus so new zero-engagement posts can surface
      const freshnessBonus = Math.max(
        0,
        FRESHNESS_MAX_BONUS - ageHours / (FRESHNESS_WINDOW_HOURS / FRESHNESS_MAX_BONUS)
      )

      // HN-style decay: score drops as age grows
      const score = (engagement + tagBoost + freshnessBonus) / Math.pow(ageHours + 2, 1.5)
      return { post: p, score }
    })
    .sort((a, b) => b.score - a.score)

  const skip = (page - 1) * limit
  return {
    data: scored.slice(skip, skip + limit).map((s) => s.post),
    total,
    page,
    limit,
  }
}
