import type { IPost, PostCreateDTO, PaginatedResponse } from "@breezy/types"
import { PostModel } from "../models/post.model"

class PostService {
  async createPost(dto: PostCreateDTO): Promise<IPost> {
    return PostModel.create({
      content: dto.content,
      authorId: dto.authorId,
      tags: dto.tags ?? [],
      mediaIds: dto.mediaIds ?? [],
    })
  }

  async getPost(id: string): Promise<IPost | null> {
    return PostModel.findById(id).exec()
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await PostModel.findByIdAndDelete(id).exec()
    return result !== null
  }

  async feed(page: number, limit: number): Promise<PaginatedResponse<IPost>> {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments({}),
    ])
    return { data, total, page, limit }
  }

  async byUser(userId: string, page: number, limit: number): Promise<PaginatedResponse<IPost>> {
    const filter = { authorId: userId }
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments(filter),
    ])
    return { data, total, page, limit }
  }
}

export default PostService
