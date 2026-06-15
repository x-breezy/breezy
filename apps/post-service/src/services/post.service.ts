import { PostModel } from "../models/post.model"
import type { CreatePostDTO } from "../schemas/post.schema"
import type { Post } from "../types/post"
import type { PaginatedResponse } from "../types/api"
import { GrpcFollowGraph, type FollowGraphPort } from "../clients/follow-graph"
import { publish } from "../clients/rabbitmq"

const MENTION_RE = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

interface TrendingCache {
  data: { tag: string; count: number }[]
  expiresAt: number
}

let trendingCache: TrendingCache | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function extractMentions(content: string, authorId: string): string[] {
  const matches = [...content.matchAll(MENTION_RE)].map((m) => m[1]!.toLowerCase())
  return [...new Set(matches)].filter((id) => id !== authorId)
}

export class PostService {
  constructor(private follow: FollowGraphPort = new GrpcFollowGraph()) {}

  async createPost(data: CreatePostDTO & { authorId: string }): Promise<Post> {
    const mentions = data.mentions ?? extractMentions(data.content, data.authorId)
    const post = await PostModel.create({
      content: data.content,
      authorId: data.authorId,
      tags: data.tags ?? [],
      mentions,
      media: data.media ?? [],
    })
    const postId = String(post._id)
    for (const targetUserId of mentions.filter((id) => id !== data.authorId)) {
      void publish("content.mention", { actorId: data.authorId, targetUserId, postId })
    }
    return post
  }

  async getPost(id: string): Promise<Post | null> {
    return PostModel.findById(id).exec() as Promise<Post | null>
  }

  async feed(viewerId: string, page: number, limit: number): Promise<PaginatedResponse<Post>> {
    const following = await this.follow.getFollowing(viewerId)
    const filter =
      following === null
        ? { authorId: { $ne: viewerId } }
        : { authorId: { $in: [...new Set(following)], $ne: viewerId } }
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments(filter),
    ])
    return { data: data, total, page, limit }
  }

  async byUser(userId: string, page: number, limit: number): Promise<PaginatedResponse<Post>> {
    const filter = { authorId: userId }
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments(filter),
    ])
    return { data: data, total, page, limit }
  }

  async deletePost(id: string): Promise<boolean> {
    const deleted = await PostModel.findByIdAndDelete(id).exec()
    return deleted !== null
  }

  async search(
    q: string,
    page: number,
    limit: number,
    authorIds?: string[],
    viewerId?: string
  ): Promise<PaginatedResponse<Post>> {
    const skip = (page - 1) * limit
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const tagRegex = new RegExp(`^${escaped}$`, "i")
    const contentRegex = new RegExp(escaped, "i")
    const safeQ = q.replace(/"/g, '\\"')
    const exclude = viewerId ? { authorId: { $ne: viewerId } } : {}

    // Fetch: exact tag match first, then text-score ranked, then regex fallback
    const tagDocs = await PostModel.find({ tags: tagRegex, ...exclude })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()

    const textDocs = await PostModel.find(
      { $text: { $search: `"${safeQ}"` }, ...exclude },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .exec()

    const regexDocs = await PostModel.find({ content: contentRegex, ...exclude })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()

    // Posts from matching authors (people search cross-join)
    const authorDocs =
      authorIds && authorIds.length > 0
        ? await PostModel.find({ authorId: { $in: authorIds, ...(viewerId ? { $ne: viewerId } : {}) } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec()
        : []

    // Merge and deduplicate while preserving priority order
    const seen = new Set<string>()
    const merged: Post[] = []
    for (const doc of [...tagDocs, ...textDocs, ...regexDocs, ...authorDocs]) {
      const id = doc._id.toString()
      if (seen.has(id)) continue
      seen.add(id)
      merged.push(doc as Post)
    }

    // Count distinct matching documents (avoid $text in $or which MongoDB rejects)
    const countPromises: Promise<number>[] = [
      PostModel.countDocuments({ tags: tagRegex, ...exclude }).exec(),
      PostModel.countDocuments({ $text: { $search: `"${safeQ}"` }, ...exclude }).exec(),
      PostModel.countDocuments({ content: contentRegex, ...exclude }).exec(),
    ]
    if (authorIds && authorIds.length > 0) {
      countPromises.push(PostModel.countDocuments({ authorId: { $in: authorIds, ...(viewerId ? { $ne: viewerId } : {}) } }).exec())
    }
    const counts = await Promise.all(countPromises)

    // Approximate total (upper bound); exact dedup would need another fetch
    const total = Math.max(...counts)
    if (total === 0 && merged.length === 0) {
      return { data: [], total: 0, page, limit }
    }

    const data = merged.slice(skip, skip + limit)
    return { data, total: Math.max(total, merged.length), page, limit }
  }

  async trendingTags(limit: number = 10): Promise<{ tag: string; count: number }[]> {
    if (trendingCache && Date.now() < trendingCache.expiresAt) {
      return trendingCache.data.slice(0, limit)
    }

    const results = await PostModel.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ])

    trendingCache = {
      data: results as { tag: string; count: number }[],
      expiresAt: Date.now() + CACHE_TTL_MS,
    }

    return results.slice(0, limit) as { tag: string; count: number }[]
  }
}

export default PostService
