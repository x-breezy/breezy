import type { Request, Response } from "express"
import ImageService from "../services/image.service"
import type { ApiResponse, IImageMeta } from "@breezy/types"
import { uploadHeadersSchema } from "../validators/image.validator"

class ImageController {
  private imageService: ImageService

  constructor(imageService: ImageService) {
    this.imageService = imageService
  }

  uploadImage = async (req: Request<Record<string, never>, ApiResponse<IImageMeta>, Buffer>, res: Response<ApiResponse<IImageMeta>>): Promise<void> => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ success: false, error: "Empty body" })
      return
    }
    const data = req.body

    const headers = uploadHeadersSchema.safeParse(req.headers)
    if (!headers.success) {
      res.status(400).json({ success: false, error: headers.error.issues[0]?.message ?? "Invalid request headers" })
      return
    }

    const image = await this.imageService.uploadImage({
      data,
      mimeType: headers.data["content-type"],
      originalName: headers.data["x-filename"],
      size: data.length,
      ownerId: headers.data["x-owner-id"],
    })

    // Strip bytes from the response — clients fetch raw bytes via GET /:id.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _bytes, ...meta } = image
    res.status(201).json({ success: true, data: meta })
  }

  /** Stream raw bytes with content-type header (suitable for <img src="...">). */
  getImage = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const image = await this.imageService.getImage(req.params.id)
    if (!image) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    res.set("content-type", image.mimeType)
    res.send(image.data)
  }

  /** Return metadata as JSON without the raw bytes. */
  getImageMeta = async (req: Request<{ id: string }>, res: Response<ApiResponse<IImageMeta>>): Promise<void> => {
    const image = await this.imageService.getImage(req.params.id)
    if (!image) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _bytes, ...meta } = image
    res.status(200).json({ success: true, data: meta })
  }

  deleteImage = async (req: Request<{ id: string }>, res: Response<ApiResponse<null>>): Promise<void> => {
    const deleted = await this.imageService.deleteImage(req.params.id)
    if (!deleted) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    res.status(200).json({ success: true, data: null })
  }
}

export default ImageController
