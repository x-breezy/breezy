import { PostModel } from "../models/post.model"
import type { CreatePostDTO } from "../schemas/post.schema"
import type { Post } from "../types/post"
import type { PaginatedResponse } from "../types/api"
import { HttpFollowGraph, type FollowGraphPort } from "../clients/follow-graph"
import { publish } from "../clients/rabbitmq"
import { GrpcFollowGraph, type FollowGraphPort } from "../clients/follow-graph"

const MENTION_RE = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

function extractMentions(content: string, authorId: string): string[] {
  const matches = [...content.matchAll(MENTION_RE)].map((m) => m[1]!.toLowerCase())
  return [...new Set(matches)].filter((id) => id !== authorId)
}

export class PostService {
  constructor(private follow: FollowGraphPort = new GrpcFollowGraph()) {}

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
}

export default PostService
