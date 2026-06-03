import type { Request, Response } from "express"
import ImageService from "../services/image.service"
import type { ApiResponse, IImage } from "@breezy/types"
import { idParamSchema, uploadHeadersSchema } from "../validators/image.validator"

class ImageController {
  private imageService: ImageService

  constructor(imageService: ImageService) {
    this.imageService = imageService
  }

  uploadImage = async (req: Request, res: Response<ApiResponse<IImage>>): Promise<void> => {
    const data = req.body as Buffer
    if (!Buffer.isBuffer(data) || data.length === 0) {
      res.status(400).json({ success: false, error: "Empty body" })
      return
    }

    const headers = uploadHeadersSchema.safeParse(req.headers)
    if (!headers.success) {
      res
        .status(400)
        .json({ success: false, error: headers.error.issues[0]?.message || "Invalid headers" })
      return
    }

    const image = await this.imageService.uploadImage({
      data,
      mimeType: headers.data["content-type"],
      originalName: headers.data["x-filename"],
      size: data.length,
      ownerId: headers.data["x-owner-id"],
    })

    res.status(201).json({ success: true, data: image })
  }

  getImage = async (req: Request, res: Response<ApiResponse<IImage>>): Promise<void> => {
    const params = idParamSchema.safeParse(req.params)
    if (!params.success) {
      res.status(400).json({ success: false, error: "Invalid id" })
      return
    }

    const image = await this.imageService.getImage(params.data.id)
    if (!image) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    res.status(200).json({ success: true, data: image })
  }

  deleteImage = async (req: Request, res: Response<ApiResponse<null>>): Promise<void> => {
    const params = idParamSchema.safeParse(req.params)
    if (!params.success) {
      res.status(400).json({ success: false, error: "Invalid id" })
      return
    }

    const deleted = await this.imageService.deleteImage(params.data.id)
    if (!deleted) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    res.status(200).json({ success: true, data: null })
  }
}

export default ImageController
