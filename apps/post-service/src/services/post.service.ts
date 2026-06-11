import { PostModel } from "../models/post.model"
import type { CreatePostDTO } from "../schemas/post.schema"
import type { Post } from "../types/post"
import type { PaginatedResponse } from "../types/api"
import { GrpcFollowGraph, type FollowGraphPort } from "../clients/follow-graph"
import { publish } from "../clients/rabbitmq"

const MENTION_RE = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

function extractMentions(content: string, authorId: string): string[] {
  const matches = [...content.matchAll(MENTION_RE)].map((m) => m[1]!.toLowerCase())
  return [...new Set(matches)].filter((id) => id !== authorId)
}

export class PostService {
  constructor(private follow: FollowGraphPort = new GrpcFollowGraph()) { }

  async createPost(data: CreatePostDTO & { authorId: string }): Promise<Post> {
    const post = await PostModel.create({
      content: data.content,
      authorId: data.authorId,
      tags: data.tags ?? [],
      media: data.media ?? [],
    })
    const postId = String(post._id)
    for (const targetUserId of extractMentions(data.content, data.authorId)) {
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
      following === null ? {} : { authorId: { $in: [...new Set([viewerId, ...following])] } }
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

  async search(q: string, page: number, limit: number): Promise<PaginatedResponse<Post>> {
    const skip = (page - 1) * limit
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const tagRegex = new RegExp(`^${escaped}$`, "i")
    const contentRegex = new RegExp(escaped, "i")

    // Prioritise exact tag match, then full-text relevance, then content substring
    const tagDocs = await PostModel.find({ tags: tagRegex })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()

    const textDocs = await PostModel.find(
      { $text: { $search: `"${q}"` } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .exec()

    const regexDocs = await PostModel.find({ content: contentRegex })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()

    // Merge: tag matches first, then text-score ranked, then regex fallback — deduplicated
    const seen = new Set<string>()
    const merged: Post[] = []
    for (const doc of [...tagDocs, ...textDocs, ...regexDocs]) {
      const id = doc._id.toString()
      if (seen.has(id)) continue
      seen.add(id)
      merged.push(doc as Post)
    }

    const total = merged.length
    const data = merged.slice(skip, skip + limit)
    return { data, total, page, limit }
  }

  async trendingTags(limit: number = 10): Promise<{ tag: string; count: number }[]> {
    const results = await PostModel.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ])
    return results as { tag: string; count: number }[]
  }
}

export default PostService
