import { PostModel } from "../models/post.model"
import type { CreatePostDTO } from "../schemas/post.schema"
import type { Post } from "../types/post"
import type { PaginatedResponse } from "../types/api"
import { HttpFollowGraph, type FollowGraphPort } from "../clients/follow-graph"

export class PostService {
  constructor(private follow: FollowGraphPort = new HttpFollowGraph()) {}

  async createPost(data: CreatePostDTO & { authorId: string }): Promise<Post> {
    const post = await PostModel.create({
      content: data.content,
      authorId: data.authorId,
      tags: data.tags ?? [],
      media: data.media ?? [],
    })
    return post
  }

  async getPost(id: string): Promise<Post | null> {
    const post = PostModel.findById(id).exec()
    return post
  }

  async feed(viewerId: string, page: number, limit: number): Promise<PaginatedResponse<Post>> {
    const following = await this.follow.getFollowing(viewerId)
    let filter: object
    if (following === null) {
      filter = {}
    } else {
      const ids = [...new Set([...following, viewerId])]
      filter = { authorId: { $in: ids } }
    }
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
