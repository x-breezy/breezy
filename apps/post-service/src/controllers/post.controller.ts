import type { Request, Response } from "express"
import PostService from "../services/post.service"
import {
  createPostBodySchema,
  ownerHeaderSchema,
  listQuerySchema,
} from "../validators/post.validator"
import { Post, PostCreateDTO } from "../types/post"
import { ApiResponse, PaginatedResponse } from "../types/api"

class PostController {
  private postService: PostService

  constructor(postService: PostService) {
    this.postService = postService
  }

  createPost = async (
    req: Request<PostCreateDTO>,
    res: Response<ApiResponse<Post>>
  ): Promise<void> => {
    const headerResult = ownerHeaderSchema.safeParse(req.headers)
    if (!headerResult.success) {
      res.status(400).json({
        success: false,
        error: headerResult.error.issues[0]?.message ?? "Missing x-owner-id header",
      })
      return
    }

    const bodyResult = createPostBodySchema.safeParse(req.body)
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: bodyResult.error.issues[0]?.message ?? "Invalid request body",
      })
      return
    }

    const post = await this.postService.createPost({
      content: bodyResult.data.content,
      authorId: headerResult.data["x-owner-id"],
      tags: bodyResult.data.tags,
      mediaIds: bodyResult.data.mediaIds,
    })

    res.status(201).json({ success: true, data: post })
  }

  getPost = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<Post>>
  ): Promise<void> => {
    const post = await this.postService.getPost(req.params.id)
    if (!post) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }
    res.json({ success: true, data: post })
  }

  deletePost = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<null>>
  ): Promise<void> => {
    const deleted = await this.postService.deletePost(req.params.id)
    if (!deleted) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }
    res.json({ success: true, data: null })
  }

  feed = async (
    req: Request,
    res: Response<ApiResponse<PaginatedResponse<Post>>>
  ): Promise<void> => {
    const queryResult = listQuerySchema.safeParse(req.query)
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        error: queryResult.error.issues[0]?.message ?? "Invalid query params",
      })
      return
    }
    const { page, limit } = queryResult.data
    const result = await this.postService.feed(page, limit)
    res.json({ success: true, data: result })
  }

  getUserPosts = async (
    req: Request<{ userId: string }>,
    res: Response<ApiResponse<PaginatedResponse<Post>>>
  ): Promise<void> => {
    const queryResult = listQuerySchema.safeParse(req.query)
    if (!queryResult.success) {
      res.status(400).json({
        success: false,
        error: queryResult.error.issues[0]?.message ?? "Invalid query params",
      })
      return
    }
    const { page, limit } = queryResult.data
    const result = await this.postService.byUser(req.params.userId, page, limit)
    res.json({ success: true, data: result })
  }
}

export default PostController
