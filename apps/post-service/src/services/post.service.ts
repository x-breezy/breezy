import { PostModel } from "../models/post.model"
import { PaginatedResponse } from "../types/api"
import { Post, PostCreateDTO } from "../types/post"

class PostService {
  async createPost(dto: PostCreateDTO): Promise<Post> {
    return PostModel.create({
      content: dto.content,
      authorId: dto.authorId,
      tags: dto.tags ?? [],
      mediaIds: dto.mediaIds ?? [],
    })
  }

  async getPost(id: string): Promise<Post | null> {
    return PostModel.findById(id).exec()
  }

  async deletePost(id: string): Promise<boolean> {
    const result = await PostModel.findByIdAndDelete(id).exec()
    return result !== null
  }

  async feed(page: number, limit: number): Promise<PaginatedResponse<Post>> {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments({}),
    ])
    return { data, total, page, limit }
  }

  async byUser(userId: string, page: number, limit: number): Promise<PaginatedResponse<Post>> {
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
